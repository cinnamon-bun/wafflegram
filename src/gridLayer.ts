import {
    AuthorKeypair,
    IStorageAsync,
    Thunk,
    WriteResult,
    isErr,
    queryByTemplateAsync,
} from 'earthstar';

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
        logLayer(`hatch: sleeping`);
        //await sleep(1000);

        // load grid config from earthstar doc
        // TODO: hardcode this for now until we have a UI for changing it.
        this.config = { numX: 3, numY: 3 };
        /*
        logLayer(`hatch: loading config`, this.id);
        let configPath = `/wafflegram-v1/grid:${this.gridName}/config.json`;
        this.config = { numX: 3, numY: 3 };
        try {
            let configDoc = await this.storage.getContent(configPath);
            if (configDoc !== '' && configDoc !== undefined) {
                this.config = {
                    numX: 3,
                    numY: 3,
                    ...JSON.parse(configDoc)
                } as GridConfig;
            }
        } catch (err) {
            console.error('problem while loading config', err);
        }
        logLayer(`hatch: config =`, this.config);
        */

        if (config.USE_FAKE_DATA) {
            // load fake data
            logLayer(`hatch: loading fake data for cells`);
            for (let [k, v] of Object.entries(FAKE_DATA_CELLS)) {
                this.cells.set(k, v);
            }
        } else {
            // load cells from earthstar docs
            logLayer(`hatch: loading cells`);
            let cellPath = `/wafflegram-v1/grid:${this.gridName}/cell:{x}-{y}.json`;
            let cellDocs = await queryByTemplateAsync(this.storage, cellPath, { contentLengthGt: 0 });
            for (let doc of cellDocs) {
                try {
                    let cell: Cell = JSON.parse(doc.content);
                    let id = `${cell.x}-${cell.y}`;
                    logLayer(`hatch: cell ${id} =`, cell);
                    this.cells.set(id, cell);
                } catch(err) {
                    console.error('problem while loading cell', err);
                }
            }
        }

        logLayer(`hatch: sleeping, almost done`);
        //await sleep(1000);
        logLayer(`hatch: done`, this.id);
        this._bump();
        this.isReady = true;
        return true;
    }
    async saveCell(keypair: AuthorKeypair, cell: Cell) {
        let cellPath = `/wafflegram-v1/grid:${this.gridName}/cell:{x}-{y}.json`;
        let result = await this.storage.set(keypair, {
            format: 'es.4',
            path: cellPath,
            content: JSON.stringify(cell),
        });
        if (isErr(result) || result === WriteResult.Ignored) {
            console.error(result);
        }
        this._bump();
    }
}