import React from 'react';

import {
    Earthbar,
    EarthstarPeer,
    LocalStorageSettingsWriter,
    useLocalStorageEarthstarSettings,
} from 'react-earthstar';
import { setLogLevels } from 'earthstar';

import {
    WafflegramGrid
} from './wafflegram';

import 'react-earthstar/styles/layout.css';
import 'react-earthstar/styles/junior.css';
import './css/earthbar-override.css';

function App() {
    // 0: error, 1: warn, 2: log, 3: debug
    setLogLevels({
        sync: 2,
        syncer2: 2,
        storage: 2,
        _other: 2
    });
    const initValues = useLocalStorageEarthstarSettings('wafflegram');
    return (
        <div className="root">
            <EarthstarPeer {...initValues}>
                <div id="earthbar-root">
                    <Earthbar />
                </div>
                <LocalStorageSettingsWriter storageKey="wafflegram" />
                <div id="app-root">
                    <WafflegramGrid />
                </div>
            </EarthstarPeer>
        </div>
    );
}

export default App;
