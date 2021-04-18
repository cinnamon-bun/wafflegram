import React, { useState, useMemo, useEffect } from 'react';

import {
    IStorageAsync,
    Query,
    queryByTemplateAsync,
    sleep,
} from 'earthstar';
import {
    useCurrentAuthor,
    useCurrentWorkspace,
    useDocuments,
    useStorage,
} from 'react-earthstar';

import {
    Stack,
    Box,
    VBox,
    Cluster,
    ClusterStretch,
} from './lib/layouts';

import { config } from './config';

//================================================================================
// LOG

let logGrid = (...args: any[]) => console.log('[grid]', ...args);
let logLayer = (...args: any[]) => console.log('    [layer]', ...args);

//================================================================================
// TYPES

interface GridConfig {
    numX: number,
    numY: number,
}
enum CellKind {
    Url,
    Blank,
    Image,
}
interface Cell {
    x: number,
    y: number,
    kind: CellKind,
    content: string,  // url or image b64
    text: string,
}

//================================================================================

class GridLayer {
    storage: IStorageAsync;
    gridName: string;
    config: GridConfig | null;
    cells: Map<string, Cell>;
    readyPromise: Promise<boolean>;
    isReady: boolean = false;
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
    async hatch(): Promise<boolean> {
        logLayer(`hatch ---`, this.id);
        logLayer(`hatch: sleeping`);
        //await sleep(1000);

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

        if (config.FAKE_DATA) {
            this.cells.set('0-0', { x: 0, y: 0, kind: CellKind.Blank, content: '', text: '00 top left' });
            this.cells.set('1-0', { x: 1, y: 0, kind: CellKind.Blank, content: '', text: '10' });
            this.cells.set('2-0', { x: 2, y: 0, kind: CellKind.Blank, content: '', text: '20 top right' });
            this.cells.set('0-1', { x: 0, y: 1, kind: CellKind.Blank, content: '', text: '01' });
            this.cells.set('1-1', { x: 1, y: 1, kind: CellKind.Blank, content: '', text: '11 center' });
            this.cells.set('2-1', { x: 2, y: 1, kind: CellKind.Blank, content: '', text: '21' });
            this.cells.set('0-2', { x: 0, y: 2, kind: CellKind.Blank, content: '', text: '02 bot left' });
            this.cells.set('1-2', { x: 1, y: 2, kind: CellKind.Blank, content: '', text: '12' });
            this.cells.set('2-2', { x: 2, y: 2, kind: CellKind.Blank, content: '', text: '22 bot right' });
        }

        logLayer(`hatch: sleeping, almost done`);
        //await sleep(1000);
        logLayer(`hatch: done`, this.id);
        this.isReady = true;
        return true;
    }
}

/*
class TimerApi {
    static makeNew(id?: string): Timer {
        return {
            id: id || '' + Math.floor(Math.random() * 999999999999),
            endTime: Date.now() + 90 * MIN,
            name: 'new timer',
            isDone: false,
        };
    }
    static async save(keypair: AuthorKeypair, storage: IStorageAsync, timer: Timer): Promise<void> {
        let result = await storage.set(keypair, {
            format: 'es.4',
            path: `/buntimer-v1/timers/common/${timer.id}!.json`,
            content: JSON.stringify(timer),
            deleteAfter: (Date.now() + 7 * DAY) * 1000,
        });
        if (isErr(result) || result === WriteResult.Ignored) {
            console.error(result);
        }
    }
    static async delete(keypair: AuthorKeypair, storage: IStorageAsync, id: string): Promise<void> {
        let result = await storage.set(keypair, {
            format: 'es.4',
            path: `/buntimer-v1/timers/common/${id}!.json`,
            content: '',
            deleteAfter: (Date.now() + 7 * DAY) * 1000,
        });
        if (isErr(result) || result === WriteResult.Ignored) {
            console.error(result);
        }
    }
}
*/

//================================================================================

let useForceRender = () => {
    let [n, setN] = React.useState(0);
    return () => setN(n + 1);
};

interface WafflegramGridProps {
    gridName?: string;
}
export let WafflegramGrid: React.FunctionComponent<any> = (props: WafflegramGridProps) => {
    logGrid('---- rendering ----');

    //let [currentWorkspace] = useCurrentWorkspace();
    //let [keypair] = useCurrentAuthor();
    let storage = useStorage();
    let forceRender = useForceRender();

    // make the layer instance (if we have a storage to base it on)
    let layer: GridLayer | null = useMemo(() => {
        if (storage === null) {
            logGrid('useMemo: instantiating layer... but storage is null, so skipping.');
            return null;
        } else {
            logGrid('useMemo: instantiating layer for real.');
            return new GridLayer(storage, props.gridName);
        }
    }, [storage]);
    logGrid(`layer:`, layer);

    // reload when the layer becomes ready
    useEffect(() => {
        if (layer === null) {
            logGrid('useEffect: waiting for layer... but layer is nuull; skipping');
            return;
        }
        let wait = async () => {
            logGrid('useEffect: waiting for layer to become ready...');
            await layer?.readyPromise;
            logGrid('useEffect: ...it is ready:', layer?.isReady);
            logGrid('useEffect: ...calling forceRender()');
            forceRender();
        };
        wait();
    }, [layer]);

    // if not set up yet, show help message
    //if (currentWorkspace === null || storage === null || keypair === null || layer === null) {
    if (storage === null || layer === null) {
        logGrid('earthstar stuff is null');
        logGrid('//// render complete ////');
        return <div>
            To use this app,
            <ol>
                <li>Join or create a workspace.</li>
                <li>Create a user, or sign in as a user, from the upper right.</li>
            </ol>
        </div>;
    }

    if (!layer.isReady) {
        logGrid('layer is not ready, showing loading message');
        logGrid('//// render complete ////');
        return <div>loading...</div>;
    }

    logGrid('layer is ready, showing actual grid');
    logGrid('//// render complete ////');
    return <div>
        <pre>{`
grid name: ${layer.gridName}
is ready: ${'' + layer.isReady}
config: ${JSON.stringify(layer.config, null, 4)}
        `}</pre>
        {[...layer.cells.values()].map(cell =>
            <div key={''+cell.x+'-'+cell.y}>
                <b>CELL</b>
                <code>{JSON.stringify(cell)}</code>
            </div>
        )};
    </div>
};