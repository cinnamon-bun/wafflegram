import React, {
    CSSProperties, useState
} from 'react';

import {
    AuthorKeypair,
    Thunk,
} from 'earthstar';

import {
    Cell,
} from './wafflegramTypes';
import { GridLayer } from './gridLayer';
import { inherits } from 'util';

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
    keypair: AuthorKeypair | null,
    layer: GridLayer,
}
export let CellView: React.FunctionComponent<any> = (props: CellProps) => {
    let { cell, isMaximized, onMaximize, onMinimize, keypair, layer } = props;
    logCell(`${cell.x}-${cell.y} -- ${cell.kind}`);

    let [isEditingCaption, setIsEditingCaption] = useState<boolean>(false);
    let [isEditing, setIsEditing] = useState<boolean>(false);
    let [tempCaption, setTempCaption] = useState<string>(cell.caption || '');

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
    let sCaptionInput: CSSProperties = {
        // TODO
        color: 'var(--base0A)',
        font: 'inherit',
        fontSize: 'inherit',
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        width: '100%',
        background: 'var(--cUnderlayWeak)',
        padding: 'var(--s1)',
        textAlign: 'center',
        border: 'none',
    }
    let sCornerButton: CSSProperties = {
        position: 'absolute',
        color: 'var(--cSemiFaint)',
        background: 'var(--cUnderlayStrong)',
        height: 'max(40px, 7%)',
        fontWeight: 'bold',
        textAlign: 'center',
        border: 'inherit',
        fontFamily: 'inherit',
        fontSize: '1.5rem',
    }
    let sCloseButton: CSSProperties = {
        ...sCornerButton,
        color: 'var(--cSemiFaint)',
        background: 'var(--cUnderlayStrong)',
        top: 0, right: 0,
        width: 'max(40px, 7%)',
        borderBottomLeftRadius: 'var(--round-button)',
    }
    let sEditButton: CSSProperties = {
        ...sCornerButton,
        color: 'var(--cEdit)',
        background: 'var(--cUnderlayStrong)',
        top: 0, left: 0,
        width: '3em',
        borderBottomRightRadius: 'var(--round-button)',
    }
    let sSaveButton: CSSProperties = {
        ...sEditButton,
        color: 'var(--cSave)',
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

    let beginEditingCaption = (evt: React.MouseEvent) => {
        if (keypair === null) { return; }
        setTempCaption(cell.caption || '');
        setIsEditingCaption(true);
        setTimeout(() => {
            let inputElem = document.getElementById('captionInput');
            if (inputElem) {
                inputElem.focus();
            }
        }, 1);
    }

    let onCaptionChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        setTempCaption(evt.target.value);
    }

    let finishEditingCaption = (evt: React.FormEvent<HTMLFormElement>) => {
        if (keypair === null) { return; }
        evt.stopPropagation();
        evt.preventDefault();

        setIsEditingCaption(false);

        logCell('Saving new caption to layer:', JSON.stringify(tempCaption));
        let updatedCell: Cell = {
            ...cell,
            caption: tempCaption,
        };
        if (updatedCell.caption === undefined) {
            delete updatedCell.caption;
        }
        // this should trigger a re-render
        layer.saveCell(keypair, updatedCell);
    }

    let hasCaption = cell.caption !== undefined && cell.caption !== '';
    let canEditCaption = keypair !== null;

    let captionElem: JSX.Element | null = null;
    if (isEditingCaption) {
        captionElem =
            <form onSubmit={finishEditingCaption}>
                <input type="text" id="captionInput"
                    style={sCaptionInput}
                    value={tempCaption}
                    onChange={onCaptionChange}
                    />
            </form>;
    } else if (hasCaption) {
        captionElem =
            <div style={sCaption} onClick={beginEditingCaption}>
                {cell.caption}
            </div>;
    } else if (isMaximized && canEditCaption) {
        captionElem =
            <div style={sCaption} onClick={beginEditingCaption}>
                (click to add caption)
            </div>;
    } else {
        // not maximized and no caption,
        // or maximized but can't edit.
        // do nothing.
    }

    let handleEditOrSave = () => {
        setIsEditing(!isEditing);
    }

    let editButtonElem =
        <button style={isEditing ? sSaveButton : sEditButton}
            onClick={ (evt) => { evt.stopPropagation(); handleEditOrSave(); }}
            >
            {isEditing ? 'Save' : 'Edit'}
        </button>;

    let X = '\u2716';
    let closeButtonElem =
        <button style={sCloseButton}
            onClick={ (evt) => { evt.stopPropagation(); onMinimize(); }}
            >
            {X}
        </button>;

    //================================================================================

    logCell('isMaximized:', isMaximized);

    return <div style={sCell} onClick={onMaximize}>
        {captionElem}
        {isMaximized ? editButtonElem : null}
        {isMaximized ? closeButtonElem : null}
    </div>;
}