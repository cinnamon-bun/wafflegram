import {
    AuthorKeypair,
    IStorageAsync,
    Thunk,
    WriteResult,
    isErr,
    queryByTemplateAsync,
    WriteEvent,
    extractTemplateVariablesFromPath,
} from 'earthstar';
import { callbackify } from 'util';

import {
    config,
    FAKE_DATA_CELLS
} from './config';

import {
    Cell,
    CellKind,
    GridConfig
} from './wafflegramTypes';

//================================================================================

let logLayer = (...args: any[]) => console.log('    [layer]', ...args);

//================================================================================

let sleep = (ms: number): Promise<void> => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    });
}

export class GridLayer {
    storage: IStorageAsync;
    gridName: string;
    config: GridConfig | null;
    cells: Map<string, Cell>;
    readyPromise: Promise<boolean>;
    isReady: boolean = false;
    onChangeCbs: Set<Thunk> = new Set();
    id: number;
    constructor(storage: IStorageAsync, gridName: string = 'main') {
        this.id = Math.random();
        logLayer(`constructor ---`, this.id);
        logLayer(`constructor: gridName = ${gridName}`);
        this.storage = storage;
        this.gridName = gridName;
        this.config = null;
        this.cells = new Map();
        logLayer(`constructor: hatching`);
        this.readyPromise = this.hatch();
        logLayer(`constructor: done.`);
    }
    onChange(cb: Thunk): Thunk {
        this.onChangeCbs.add(cb);
        return () => { this.onChangeCbs.delete(cb); };
    }
    _bump(): void {
        for (let cb of this.onChangeCbs) {
            cb();
        }
    }
    async hatch(): Promise<boolean> {
        logLayer(`hatch ---`, this.id);
        //logLayer(`hatch: sleeping ~~~~~~~~~~~~~~~~~~~~~`);
        //await sleep(2000);

        // load grid config from earthstar doc
        // TODO: hardcode this for now until we have a UI for changing it.
        this.config = { numX: 3, numY: 3 };

        if (config.USE_FAKE_DATA) {
            // load fake data
            logLayer(`hatch: loading fake data for cells`);
            for (let [k, v] of Object.entries(FAKE_DATA_CELLS)) {
                this.cells.set(k, v);
            }
        } else {
            // load cells from earthstar docs
            logLayer(`hatch: making empty cells`);
            for (let y = 0; y < this.config.numY; y++) {
                for (let x = 0; x < this.config.numX; x++) {
                    let cell: Cell = { x, y, kind: 'COLOR', content: '' };
                    let cellKey = `${cell.x}-${cell.y}`;
                    this.cells.set(cellKey, cell);
                }
            }
            logLayer(`hatch: loading cells`);
            let cellPath = `/wafflegram-v1/grid:${this.gridName}/cell:{x}-{y}.json`;
            let cellDocs = await queryByTemplateAsync(this.storage, cellPath, { contentLengthGt: 0 });
            for (let doc of cellDocs) {
                try {
                    let cell: Cell = JSON.parse(doc.content);
                    let cellKey = `${cell.x}-${cell.y}`;
                    logLayer(`hatch: cell ${cellKey} =`, cell);
                    this.cells.set(cellKey, cell);
                } catch(err) {
                    console.error('problem while loading cell', err);
                }
            }
        }

        // when storage changes, re-render
        this.storage.onWrite.subscribe((evt: WriteEvent) => {
            logLayer('storage.onWrite -----> update cells cache and _bump()', evt);
            // make sure we care about this write event
            if (evt.kind !== 'DOCUMENT_WRITE') { return; }
            if (evt.isLatest === false) { return; }  // skip old history documents
            let doc = evt.document;
            if (doc.content === '') { return; }  // skip deleted documents
            // extract x and y from the doc path
            let template = `/wafflegram-v1/grid:{gridName}/cell:{x}-{y}.json`;
            let vars: Record<string, string> | null = extractTemplateVariablesFromPath(template, doc.path);
            if (vars === null) { return; }
            if ('x' in vars && 'y' in vars && 'gridName' in vars && vars.gridName === this.gridName) {
                let x = +vars.x;
                let y = +vars.y;
                let cell = JSON.parse(doc.content);
                // validate x and y match document content
                if (x !== cell.x || y !== cell.y) { return; }
                let cellKey = `${cell.x}-${cell.y}`;
                // save to our cell cache
                this.cells.set(cellKey, cell);
                // tell our subscribers something changed
                this._bump();
            }
        });

        //logLayer(`hatch: sleeping, almost done ~~~~~~~~~~~~~~~~~~~~~`);
        //await sleep(2000);
        logLayer(`hatch: done`, this.id);
        this.isReady = true;
        return true;
    }
    async saveCell(keypair: AuthorKeypair, cell: Cell) {
        let cellPath = `/wafflegram-v1/grid:${this.gridName}/cell:${cell.x}-${cell.y}.json`;
        logLayer('saveCell: path:', cellPath);
        logLayer('saveCell: cell:', cell);
        let result = await this.storage.set(keypair, {
            format: 'es.4',
            path: cellPath,
            content: JSON.stringify(cell),
        });
        if (isErr(result) || result === WriteResult.Ignored) {
            console.error(result);
        }
    }
}
