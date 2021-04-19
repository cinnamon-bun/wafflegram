import React, {
    useState,
    useMemo,
    useEffect,
    CSSProperties
} from 'react';

import {
    AuthorKeypair,
    IStorageAsync,
    Thunk,
    WriteResult,
    isErr,
    queryByTemplateAsync,
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

import { config, img64otter } from './config';

//================================================================================
// LOG

let logGrid = (...args: any[]) => console.log('[grid]', ...args);
let logCell = (...args: any[]) => console.log('  [cell]', ...args);
let logLayer = (...args: any[]) => console.log('    [layer]', ...args);

//================================================================================
// TYPES

interface GridConfig {
    numX: number,
    numY: number,
}
enum CellKind {
    Url,    // content is a url to an image
    Color,  // content is a color like #ff9900, or ''
    B64Image,  // content is b64 image data
}
interface Cell {
    x: number,
    y: number,
    kind: CellKind,
    content: string,
    caption?: string,
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
            this.cells.set('0-0', { x: 0, y: 0, kind: CellKind.Color, content: '', caption: '00 top left' });
            this.cells.set('1-0', { x: 1, y: 0, kind: CellKind.Color, content: '', });
            this.cells.set('2-0', { x: 2, y: 0, kind: CellKind.Color, content: '', caption: '20 top right with long caption that will word-wrap' });
            this.cells.set('0-1', { x: 0, y: 1, kind: CellKind.B64Image, content: img64otter, caption: 'b64 image', });
            this.cells.set('1-1', { x: 1, y: 1, kind: CellKind.Color, content: '', caption: '11 center' });
            this.cells.set('2-1', { x: 2, y: 1, kind: CellKind.Url, content: 'https://d.furaffinity.net/art/seyorrol/1609783106/1609783106.seyorrol_commissiondeo_01.jpg', caption: 'an image provided by URL' });
            this.cells.set('0-2', { x: 0, y: 2, kind: CellKind.Color, content: '#334455', caption: '02 bot left' });
            this.cells.set('1-2', { x: 1, y: 2, kind: CellKind.Color, content: '#445566', caption: '' });
            this.cells.set('2-2', { x: 2, y: 2, kind: CellKind.Color, content: '#557799', caption: '22 bot right' });
        }

        logLayer(`hatch: sleeping, almost done`);
        //await sleep(1000);
        logLayer(`hatch: done`, this.id);
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
    }
}

//================================================================================

let useForceRender = () => {
    let [n, setN] = React.useState(0);
    return () => setN(n + 1);
};

interface GridProps {
    gridName?: string;
}
export let WafflegramGrid: React.FunctionComponent<any> = (props: GridProps) => {
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

    let [maximizedCell, setMaximizedCell] = useState<Cell | null>(null);

    //--------------------------------------------------------------------------------

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

    let sGrid: CSSProperties = {
        display: 'grid',
        gridAutoColumns: '1fr',
        gridAutoRows: '1fr',

        gap: 'var(--s2)',
        marginTop: 'var(--s2)',
        padding: 'var(--s2)',

        // todo: https://css-tricks.com/aspect-ratio-boxes/
        // https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit  -- works everywhere
        // https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio  -- not on firefox yet
        // https://web.dev/aspect-ratio/
        height: '100vw',
        width: '100vw',

        backgroundColor: 'var(--gr4)',
    };

    let cells: Cell[] = [...layer.cells.values()];
    if (maximizedCell !== null) {
        // hack
        cells = [maximizedCell];
    }

    logGrid(`I have ${cells.length} cells`);
    return <div>
        <div style={sGrid}>
            {cells.map(cell =>
                <WafflegramCell
                    key={`${cell.x}-${cell.y}`}
                    cell={cell}
                    isMaximized={maximizedCell === cell}
                    onMaximize={() => setMaximizedCell(cell)}
                    onMinimize={() => setMaximizedCell(null)}
                />
            )}
        </div>

        <pre>{`
grid name: ${layer.gridName}
is ready: ${'' + layer.isReady}
config: ${JSON.stringify(layer.config, null, 4)}
        `}</pre>
    </div>
};

interface CellProps {
    cell: Cell,
    isMaximized: boolean,
    onMaximize: Thunk,
    onMinimize: Thunk,
}
let WafflegramCell: React.FunctionComponent<any> = (props: CellProps) => {
    let { cell, isMaximized, onMaximize, onMinimize } = props;
    logCell(`${cell.x}-${cell.y}`);

    let sCell: CSSProperties = {
        backgroundColor: 'var(--gr5)',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
    };
    let sCaption: CSSProperties = {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        padding: 'var(--s1)',
        textAlign: 'center',
    }

    let st: CSSProperties = sCell;
    if (isMaximized) {
        // when maximized, it's the only cell
        // and it's in slot 1-1
        st = {
            ...st,
            gridColumn: 1,
            gridRow: 1,
        };
    } else {
        // otherwise it's in its normal slot
        st = {
            ...st,
            gridColumn: cell.x + 1,
            gridRow: cell.y + 1,
        };
    }
    if (cell.kind === CellKind.Color && cell.content !== '') {
        st.backgroundColor = cell.content;
    }
    if (cell.kind === CellKind.Url && cell.content !== '') {
        delete st.backgroundColor;
        st.background = `center / cover no-repeat url(${cell.content})`;
    }
    if (cell.kind === CellKind.B64Image && cell.content !== '') {
        let url = 'data:image/jpeg;base64,' + cell.content;
        st.background = `center / cover no-repeat url(${url})`;
    }

    let sCloseButton: CSSProperties = {
        position: 'absolute',
        top: 0, right: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        padding: 'var(--s2)',
        textAlign: 'center',
        color: 'inherit',
        border: 'inherit',
        fontFamily: 'inherit',
        fontSize: 'inherit',
    }

    return <div style={st} onClick={onMaximize}>
        {/* caption bar, if needed */}
        {(cell.caption !== undefined && cell.caption !== '')
            ? <div style={sCaption}>{cell.caption}</div>
            : null
        }
        {/* minimize button, if needed */}
        {isMaximized
            ? <button style={sCloseButton}
                onClick={ (evt) => {evt.stopPropagation(); onMinimize(); }}
                >
                    X
                </button>
            : null
        }
    </div>;
}
