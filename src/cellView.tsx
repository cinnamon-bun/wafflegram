import React, {
    CSSProperties, useState
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
    let [isEditing, setOnEdit] = useState<boolean>(false);

    let { cell, isMaximized, onMaximize, onMinimize } = props;
    logCell(`${cell.x}-${cell.y} -- ${cell.kind}`);

    //================================================================================
    // styles

    let sCell: CSSProperties = {
        backgroundColor: 'var(--cEmptyCell)',
        //border: '2px solid var(--cEmptyCell)',
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
    let sEditButton: CSSProperties = {
        position: 'absolute',
        color: 'var(--cEdit)',
        top: 0, left: 0,
        width: '3em',
        height: 'max(40px, 7%)',
        background: 'var(--cUnderlayStrong)',
        fontWeight: 'bold',
        textAlign: 'center',
        border: 'inherit',
        fontFamily: 'inherit',
        fontSize: '1.5rem',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 'var(--round-button)',
    }
    let sSaveButton: CSSProperties = {
        ...sEditButton,
        color: 'var(--cSave)',
    }
    let sCloseButton: CSSProperties = {
        position: 'absolute',
        color: 'var(--cSemiFaint)',
        top: 0, right: 0,
        width: 'max(40px, 7%)',
        height: 'max(40px, 7%)',
        background: 'var(--cUnderlayStrong)',
        fontWeight: 'bold',
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

    //================================================================================
    // elements

    let hasCaption = cell.caption !== undefined && cell.caption !== '';
    let showCaption = hasCaption  || (isMaximized && cell.kind === 'IMAGE_URL' && cell.content !== '');
    let captionWithLinkElem: JSX.Element | null = null;
    if (showCaption) {
        captionWithLinkElem =
            <div style={sCaption}>
                {cell.caption}
                {(cell.kind === 'IMAGE_URL' && cell.content !== '')
                    ? <span> &nbsp; <a href={cell.content}>(link)</a></span>
                    : null
                }
            </div>;
    }

    let saveButtonElem = 
        <button style={isEditing ? sEditButton : sSaveButton}
            onClick={ (evt) => { evt.stopPropagation(); setOnEdit(!isEditing); } }
            >
            {isEditing ? "Save" : "Edit"}
        </button>;

    let X = '\u2716';
    let closeButtonElem =
        <button style={sCloseButton}
            onClick={ (evt) => { evt.stopPropagation(); onMinimize(); }}
            >
            {X}
        </button>;

    //================================================================================

    return <div style={sCell} onClick={onMaximize}>
        {captionWithLinkElem}
        {isMaximized
            ? <>
                {saveButtonElem}
                {closeButtonElem}
            </>
            : null
        }
    </div>;
}