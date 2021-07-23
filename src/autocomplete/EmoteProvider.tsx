import React from 'react';
import { _t } from '../languageHandler';
import AutocompleteProvider from './AutocompleteProvider';
import {MatrixClientPeg} from '../MatrixClientPeg';
import {PillCompletion} from './Components';
import {ICompletion, ISelectionRange} from './Autocompleter';
import * as sdk from '../index';
import _sortBy from 'lodash/sortBy';
import RoomViewStore from "../stores/RoomViewStore";

const EMOTE_REGEX = /(\S+)/g;
const LIMIT = 20;

function score(query, space) {
    const index = space.indexOf(query);
    if (index === -1) {
        return Infinity;
    } else {
        return index;
    }
}

export default class EmoteProvider extends AutocompleteProvider {
    client: any;
    emoteData: any[];
    fn: any;
    roomFn: any;

    constructor() {
        super(EMOTE_REGEX);
        this.client = MatrixClientPeg.get();
        this.emoteData = [];
        this.loadEmotes();
        this.listenChanges();
    }

    loadEmotes() {
        this.emoteData = [];
        const normalizeEmotePackName = (name) => {
          name = name.replace(/ /g, '-');
          name = name.replace(/[^\w-]/g, '');
          return name.toLowerCase();
        };
        const allMxcs = new Set();
        const addEmotePack = (packName, content, packNameOverride?) => {
            const emotes = content.images || content.emoticons;
            if (!emotes && !content.short) {
                return;
            }
            if (content.pack && content.pack.name) {
                packName = content.pack.name;
            }
            if (packNameOverride) {
                packName = packNameOverride;
            }
            packName = normalizeEmotePackName(packName);
            if (emotes) {
                for (const key of Object.keys(emotes)) {
                    if (emotes[key].url.startsWith('mxc://') && !allMxcs.has(emotes[key].url)) {
                        allMxcs.add(emotes[key].url);
                        this.emoteData.push({
                            code: key[0] === ':' ? key : `:${key}:`,
                            mxc: emotes[key].url,
                            packName: packName,
                        });
                    }
                }
            } else {
                for (const key of Object.keys(content.short)) {
                    if (content.short[key].startsWith('mxc://') && !allMxcs.has(content.short[key])) {
                        allMxcs.add(content.short[key]);
                        this.emoteData.push({
                            code: key,
                            mxc: content.short[key],
                            packName: packName,
                        });
                    }
                }
            }
        };

        // first add the user emotes
        const userEmotes = this.client.getAccountData('minority.destroyer.user_emotes');
        if (userEmotes && !userEmotes.error && userEmotes.event.content) {
            addEmotePack('user', userEmotes.event.content);
        }

        // next add the external room emotes
        const emoteRooms = this.client.getAccountData('minority.destroyer.emote_rooms');
        if (emoteRooms && !emoteRooms.error && emoteRooms.event.content && emoteRooms.event.content.rooms) {
            for (const roomId of Object.keys(emoteRooms.event.content.rooms)) {
                const room = this.client.getRoom(roomId);
                if (!room) {
                    continue;
                }
                for (const stateKey of Object.keys(emoteRooms.event.content.rooms[roomId])) {
                    let event = room.currentState.getStateEvents('minority.destroyer.room_emotes', stateKey);
                    if (event) {
                        event = event.event || event;
                        addEmotePack(roomId, event.content, emoteRooms.event.content.rooms[roomId][stateKey]['name']);
                    }
                }
            }
        }

        // finally add all the room emotes
        const thisRoomId = RoomViewStore.getRoomId();
        const thisRoom = this.client.getRoom(thisRoomId);
        if (thisRoom) {
            const events = thisRoom.currentState.getStateEvents('minority.destroyer.room_emotes');
            for (let event of events) {
                event = event.event || event;
                addEmotePack(event.state_key || 'room', event.content);
            }
        }
    }

    listenChanges() {
        this.fn = (event) => {
            this.loadEmotes();
        };
        this.client.on("accountData", this.fn);
        this.roomFn = (event, room) => {
            if ((event.event || event).type === 'minority.destroyer.room_emotes') {
                this.loadEmotes();
            }
        };
        this.client.on("Room.timeline", this.roomFn);
    }

    match(s) {
        if (s.length == 0) {
            return [];
        }
        const firstChar = s[0];
        s = s.toLowerCase().substring(1);

        const results = [];
        this.emoteData.forEach((e) => {
            if (e.code[0] == firstChar && e.code.toLowerCase().includes(s)) {
                results.push(e);
            }
        });
        return results;
    }

    async getCompletions(query: string, selection: ISelectionRange, force?: boolean): Promise<ICompletion[]> {

        let completions = [];
        const {command, range} = this.getCurrentCommand(query, selection);
        if (command) {
            const EmoteAvatar = sdk.getComponent('views.avatars.EmoteAvatar');

            const matchedString = command[1];
            completions = this.match(matchedString);
            try {
                completions = _sortBy(completions, [
                    (c) => score(matchedString, c.code),
                    (c) => c.code.length,
                ]).slice(0, LIMIT).map((result) => {
                    const mxc = result.mxc;
                    const code = result.code;
                    return {
                        completion: code,
                        completionId: mxc,
                        type: 'emote',
                        suffix: ' ',
                        href: 'emote://'+mxc,
                        component: (
                            <PillCompletion title={`${code} (${result.packName})`}>
                                <EmoteAvatar width={24} height={24} mxcUrl={mxc} name={code} />
                            </PillCompletion>
                        ),
                        range,
                    };
                });
            } catch (e) {
                console.error(e);
                completions = [];
            }
        }
        return completions;
    }

    getName() {
        return _t('Emotes');
    }

    renderCompletions(completions: React.Component[]): React.ReactNode {
        return <div className="mx_Autocomplete_Completion_container_pill">
            { completions }
        </div>;
    }

    destroy() {
        this.client.off("accountData", this.fn);
        this.client.off("Room.timeline", this.roomFn);
    }
}
