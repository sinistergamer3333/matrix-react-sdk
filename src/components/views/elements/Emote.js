

import React from 'react';
import PropTypes from 'prop-types';
import {MatrixClientPeg} from '../../../MatrixClientPeg';

const REGEX_EMOTE = /^emote:\/\/(.*)$/;

export default class Emote extends React.Component {
    static propTypes = {
        url: PropTypes.string,
        alt: PropTypes.string,
    };

    static defaultProps = {};

    static isEmoteUrl(url) {
        return !!REGEX_EMOTE.exec(url);
    }

    render() {
        const cli = MatrixClientPeg.get();
        const url = cli.mxcUrlToHttp(this.props.url.replace('emote://', ''), 800, 32);
        return <img src={url} height={32} alt={this.props.alt} title={this.props.alt} />;
    }
}
