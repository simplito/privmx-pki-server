import * as types from ".";

export interface Event {
    channel: types.core.ChannelName;
    type: string;
    data: any;
}
