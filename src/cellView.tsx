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
    let { cell, isMaximized, onMaximize, onMinimize } = props;
    logCell(`${cell.x}-${cell.y} -- ${cell.kind}`);

    let [isEditingCaption, setIsEditingCaption] = useState<boolean>(false);
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

    let beginEditingCaption = (evt: React.MouseEvent) => {
        setTempCaption(cell.caption || '');
        setIsEditingCaption(true);
    }

    let onCaptionChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        setTempCaption(evt.target.value);
    }

    let finishEditingCaption = (evt: React.FormEvent<HTMLFormElement>) => {
        evt.stopPropagation();
        evt.preventDefault();

        setIsEditingCaption(false);
        // TODO
        logCell('todo: save new caption to layer', tempCaption);
    }

    let hasCaption = cell.caption !== undefined && cell.caption !== '';
    let captionElem: JSX.Element | null = null;
    if (isEditingCaption) {
        captionElem =
            <form onSubmit={finishEditingCaption}>
                <input type="text"
                    style={sCaptionInput}
                    value={tempCaption}
                    onChange={onCaptionChange}
                    />
            </form>;
    } else {
        if (isMaximized || hasCaption) {
            captionElem =
                <div style={sCaption} onClick={beginEditingCaption}>
                    {hasCaption ? cell.caption : '(click to add caption)'}
                </div>;
        }
    }

    let X = '\u2716';
    let closeButtonElem =
        <button style={sCloseButton}
            onClick={ (evt) => { evt.stopPropagation(); onMinimize(); }}
            >
            {X}
        </button>;

    //================================================================================

    return <div style={sCell} onClick={onMaximize}>
        {captionElem}
        {isMaximized ? closeButtonElem : null}
    </div>;
}