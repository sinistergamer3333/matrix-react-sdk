

import React from 'react';

import EmotesPanel from "../../EmotesPanel.js";
import { _t } from '../../../../../languageHandler';

export default class EmotesUserSettingsTab extends React.Component {
    constructor(props, context) {
        super(props, context);
    }

    render() {
        return (
            <div className="mx_SettingsTab mx_EmotesUserSettingsTab">
                <div className="mx_SettingsTab_heading">{ _t("Emotes") }</div>
                <EmotesPanel />
            </div>
        );
    }
}
