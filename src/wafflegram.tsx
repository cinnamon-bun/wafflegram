import React, {
    useState,
    useMemo,
    useEffect,
    CSSProperties
} from 'react';

import {
    useCurrentAuthor,
    useStorage,
} from 'react-earthstar';

import {
    Cell,
} from './wafflegramTypes';
import {
    GridLayer
} from './gridLayer';
import {
    CellView
} from './cellView';

//================================================================================
// LOG

let logGrid = (...args: any[]) => console.log('[grid]', ...args);

//================================================================================

let useForceRender = () => {
    let [n, setN] = React.useState<number>(0);
    return () => setN((n: number) => n + 1);
};

interface GridProps {
    gridName?: string;
}
export let WafflegramGridView: React.FunctionComponent<any> = (props: GridProps) => {
    logGrid('---- rendering ----');

    //let [currentWorkspace] = useCurrentWorkspace();
    let [keypair] = useCurrentAuthor();
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
            logGrid('useEffect: waiting for layer... but layer is null; skipping');
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

    // render when layer changes
    useEffect(() => {
        if (layer !== null) {
            return layer.onChange(() => {
                logGrid('useEffect: layer.onChange ----> forceRender');
                forceRender()
                logGrid('render should have happened');
            });
        }
    }, [layer]);

    let [maximizedCellKey, setMaximizedCellKey] = useState<string | null>(null);  // like '3-3'

    //--------------------------------------------------------------------------------

    // if not set up yet, show help message
    //if (currentWorkspace === null || storage === null || keypair === null || layer === null) {
    if (storage === null || layer === null) {
        logGrid('earthstar stuff is null');
        logGrid('//// render complete ////');
        return <div style={{padding: 'var(--s3)'}}>
            <h1>Wafflegram</h1>
            <p>A grid of images for you and your friends to mess with.</p>
            <p>To use this app,</p>
            <ol>
                <li>Join or create a workspace.</li>
                <li>You will be in read-only mode until you sign in or create a user at the upper right.</li>
            </ol>
            <p><a href="https://github.com/cinnamon-bun/wafflegram">Source code</a></p>
        </div>;
    }

    if (!layer.isReady) {
        logGrid('layer is not ready, showing loading message');
        logGrid('//// render complete ////');
        return <div>loading...</div>;
    }

    logGrid('layer is ready, showing actual grid');

    let sGrid: CSSProperties = {
        display: 'grid',
        gridAutoColumns: '1fr',
        gridAutoRows: '1fr',

        gap: 'var(--s05)',
        //marginTop: 'var(--s1)',
        padding: 'var(--s3)',
        margin: '0 auto',

        // todo: https://css-tricks.com/aspect-ratio-boxes/
        // https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit  -- works everywhere
        // https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio  -- not on firefox yet
        // https://web.dev/aspect-ratio/
        height: 'min(100vw, 85vh)',
        width: 'min(100vw, 85vh)',

        backgroundColor: 'var(--cGridBorder)',
    };

    let cellsToRender: Cell[] = [...layer.cells.values()];
    if (maximizedCellKey !== null) {
        cellsToRender = [layer.cells.get(maximizedCellKey) as Cell];
    }

    logGrid(`Rendering ${cellsToRender.length} cells:`, cellsToRender);
    logGrid('//// render complete ////');
    return <div>
        <div style={sGrid}>
            {cellsToRender.map(cell =>
                <CellView
                    key={`${cell.x}-${cell.y}`}
                    cell={cell}
                    isMaximized={maximizedCellKey !== null}
                    onMaximize={() => setMaximizedCellKey(`${cell.x}-${cell.y}`)}
                    onMinimize={() => setMaximizedCellKey(null)}
                    keypair={keypair}
                    layer={layer}
                />
            )}
        </div>

        {/*
        <pre>{`
grid name: ${layer.gridName}
is ready: ${'' + layer.isReady}
config: ${JSON.stringify(layer.config, null, 4)}
        `}</pre>
        */}
    </div>
};
