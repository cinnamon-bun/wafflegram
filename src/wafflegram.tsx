import React, {
    useState,
    useMemo,
    useEffect,
    CSSProperties
} from 'react';

import {
    Thunk,
} from 'earthstar';

import {
    useCurrentAuthor,
    useCurrentWorkspace,
    useDocuments,
    useStorage,
} from 'react-earthstar';

/*
import {
    Stack,
    Box,
    VBox,
    Cluster,
    ClusterStretch,
} from './lib/layouts';
*/

import {
    Cell,
    CellKind,
    GridConfig
} from './wafflegramTypes';
import { GridLayer } from './gridLayer';

//================================================================================
// LOG

let logGrid = (...args: any[]) => console.log('[grid]', ...args);
let logCell = (...args: any[]) => console.log('  [cell]', ...args);

//================================================================================

let useForceRender = () => {
    let [n, setN] = React.useState(0);
    return () => setN(n + 1);
};

interface GridProps {
    gridName?: string;
}
export let WafflegramGridView: React.FunctionComponent<any> = (props: GridProps) => {
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
    logGrid('//// render complete ////');

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

        {/*
        <pre>{`
grid name: ${layer.gridName}
is ready: ${'' + layer.isReady}
config: ${JSON.stringify(layer.config, null, 4)}
        `}</pre>
        */}
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
    logCell(`${cell.x}-${cell.y} -- ${cell.kind}`);

    let sCell: CSSProperties = {
        backgroundColor: 'var(--cEmptyCell)',
        borderRadius: 'var(--round-card)',
        overflow: 'hidden',
        position: 'relative',
    };
    let sCaption: CSSProperties = {
        color: 'var(--cSemiFaint)',
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        background: 'var(--cUnderlayWeak)',
        padding: 'var(--s1)',
        textAlign: 'center',
    }
    let sCloseButton: CSSProperties = {
        position: 'absolute',
        color: 'var(--cSemiFaint)',
        top: 0, right: 0,
        width: 'max(40px, 7%)',
        height: 'max(40px, 7%)',
        background: 'var(--cUnderlayStrong)',
        textAlign: 'center',
        border: 'inherit',
        fontFamily: 'inherit',
        fontSize: '1.5rem',
        borderBottomLeftRadius: 'var(--round-button)',
    }

    // set grid position
    if (isMaximized) {
        // when maximized, it's the only cell
        // and it's in slot 1-1
        sCell = {
            ...sCell,
            gridColumn: 1,
            gridRow: 1,
        };
    } else {
        // otherwise it's in its normal slot
        sCell = {
            ...sCell,
            gridColumn: cell.x + 1,
            gridRow: cell.y + 1,
        };
    }

    // set background color or image
    if (cell.kind === 'COLOR' && cell.content !== '') {
        sCell.backgroundColor = cell.content;
    }
    if (cell.kind === 'IMAGE_URL' && cell.content !== '') {
        delete sCell.backgroundColor;
        // crop image to fill entire square with no letterboxing
        sCell.background = `center / cover no-repeat url(${cell.content})`;
    }
    if (cell.kind === 'IMAGE_B64' && cell.content !== '') {
        let url = 'data:image/jpeg;base64,' + cell.content;
        // crop image to fill entire square with no letterboxing
        sCell.background = `center / cover no-repeat url(${url})`;
    }

    let hasCaption = cell.caption !== undefined && cell.caption !== '';
    let captionWithLink = <div style={sCaption}>
        {cell.caption}
        {(cell.kind === 'IMAGE_URL' && cell.content !== '')
            ? <span> &nbsp; <a href={cell.content}>(link)</a></span>
            : null
        }
    </div>;
    let showCaption = hasCaption || (isMaximized && cell.kind === 'IMAGE_URL' && cell.content !== '');


    let X = '\u2716';
    return <div style={sCell} onClick={onMaximize}>
        {/* caption bar, if needed */}
        {showCaption ? captionWithLink : null }

        {/* minimize button, if needed */}
        {isMaximized
            ? <button style={sCloseButton}
                onClick={ (evt) => {evt.stopPropagation(); onMinimize(); }}
                >
                    {X}
                </button>
            : null
        }
    </div>;
}
