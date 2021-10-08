import React, {
    CSSProperties
} from 'react';

import {
    Thunk,
} from 'earthstar';

import {
    Cell,
} from './wafflegramTypes';

/*
import {
    Stack,
    Box,
    VBox,
    Cluster,
    ClusterStretch,
} from './lib/layouts';
*/

//================================================================================
// LOG

let logCell = (...args: any[]) => console.log('  [cell]', ...args);

//================================================================================

interface CellProps {
    cell: Cell,
    isMaximized: boolean,
    onMaximize: Thunk,
    onMinimize: Thunk,
}
export let CellView: React.FunctionComponent<any> = (props: CellProps) => {
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