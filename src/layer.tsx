import {
    Query,
    Document,
    DocToSet,
    IStorageAsync,
    queryByTemplateAsync,
    insertVariablesIntoTemplate,
} from 'earthstar';
import { SuperbusMap } from 'superbus-map';

//================================================================================

interface StringFieldOpts {
    useWhen: 'ALWAYS' | [string, string],  // [{template} === value]
    valueFrom: 'DOC_CONTENT' | string, // {template}
    required?: boolean, // default true
    minLength?: number,
    maxLength?: number,
}
class StringField {
    constructor(public opts: StringFieldOpts) {
    }
}

interface BooleanFieldOpts {
    useWhen: 'ALWAYS' | [string, string],  // [{template} === value]
    valueFrom: 'DOC_CONTENT' | string, // {template}
    required?: boolean, // default true
}
class BooleanField {
    constructor(public opts: BooleanFieldOpts) {
    }
}

//================================================================================

interface Spec<T> {
    pathTemplate: string,
    primaryKey: (path: string, templateVars: Record<string, string>) => string,
    fields: {
        // keyof T
        [key: string]: StringField,
    }
}
interface Todo {
    id: string,
    text: string,
    isDone: boolean,
}

let todoSpec: Spec<Todo> = {
    pathTemplate: '/todos/v1/{id}/{filename}',
    primaryKey: (path: string, templateVars: Record<string, string>): string => {
        return templateVars.id;
    },
    fields: {
        id: new StringField({
            useWhen: 'ALWAYS',
            valueFrom: '{id}',
        }),
        text: new StringField({
            useWhen: ['{filename}', 'text.txt'],
            valueFrom: 'DOC_CONTENT',
        }),
        isDone: new BooleanField({
            useWhen: ['{filename}', 'isDone.txt'],
            valueFrom: 'DOC_CONTENT',
        })
    }
}

//================================================================================

type FilterFn = (doc: Document) => boolean;
interface QueryAndFilterFn {
    query: Query,
    filterFn: FilterFn,
}

class SpecHandler<T> {
    completeThings: SuperbusMap<string, T>;
    incompleteThings: SuperbusMap<string, T>;
    storage: IStorageAsync;
    spec: Spec<T>;
    constructor(spec: Spec<T>, storage: IStorageAsync) {
        this.spec = spec;
        this.completeThings = new SuperbusMap<string, T>();
        this.incompleteThings = new SuperbusMap<string, T>();
        this.storage = storage;
    }
    async queryAllDocs(): Promise<Document[]> {
        // build a query based on the pathTemplate
        return await queryByTemplateAsync(this.storage, this.spec.pathTemplate, {});
    }
    async queryDocsWithTemplateVariables(variables: Record<string, string>): Promise<Document[]> {
        // build a query based on the pathTemplate
        // but with each {fieldName} replaced with value
        let template2 = insertVariablesIntoTemplate(variables, this.spec.pathTemplate);
        return await queryByTemplateAsync(this.storage, template2, {});
    }
    docToPartialObj(doc: Document): Partial<T> {
        // convet an earthstar document to a partial domain object
        // using the Field classes
        return null as any; // TODO
    }
    objIsComplete(partialObj: Partial<T>): boolean {
        // given an actual domain object,
        // check if all the required fields are present
        return true; // TODO
    }
    validateObj(obj: T): Error | true {
        // given an actual domain object,
        // check if all the fields are valid
        return true; // TODO
    }
    setState(partialObj: Partial<T>): DocToSet[] {
        // given a partial obj,
        // convert it into one or more Earthstar docs to write
        return []; // TODO
    }
}

//================================================================================
/*

given a spec,
    generate a query for all matching docs
    and a filter function

given a spec and an id,
    generate a query for all docs about that id
    and a filter function

given a doc,
    parse its path
    build up a partial Todo

given some partial todos
    merge them

given a Todo
    validate it

given a partial Todo as a setState write operation,
    validate it
    generate doc(s)

*/



