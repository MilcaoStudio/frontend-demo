// place files you want to import through the `$lib` alias in this folder.
import { SvelteMap } from "svelte/reactivity"
import { API, ChannelCollection, Channel, type User } from "uprising.js";
import AppState from "./persistent/AppState";
import { useClient } from "./uprising.js/LocalClient";

const channels: API.Channel[] = [
    { id: "01JB56QAJR6T3ZP14HVCE52KVN", name: "General", server: "01HRSZB6J5PW9D2XGBZVZAKGFA", type: "text", description: "This is a general chat room for the server." },
    { id: "01JB56QAJSJGNSCHA5FY409T8E", name: "Gaming Room", server: "01HRSZB6J5PW9D2XGBZVZAKGFA", "type": "voice", description: null },
    { id: "01JB56QAJS0CKZG7NGDDVYD1WZ", name: "Gaming Room", server: "01HRSZB6J5PW9D2XGBZVZAKGFA",  "type": "voice", description: null},
    { id: "01JB56QAJSD16YZ38X7NY5RCNW", name: "Music", server: "01HRSZB6J5PW9D2XGBZVZAKGFA", "type": "voice", description: null },
    { id: "01JB56QAJS4AJH74QTPPHX4CQX", name: "Music", server: "01HRSZB6J5PW9D2XGBZVZAKGFA", "type": "voice", description: null },
];
const client = useClient();
client.channels = new ChannelCollection(channels.map( c => new Channel(c)));

export function getChannel(id: string) {
    return client.channels.get(id);
}

export class Server {
    constructor(public readonly id: string) {}
    get channels() {
        return client.channels.values().filter(c => c.serverId == this.id );
    }
}

export const users: Map<string, User> = new SvelteMap;
export const server = new Server("01HRSZB6J5PW9D2XGBZVZAKGFA");
export const lastChannel = "01JB56QAJR6T3ZP14HVCE52KVN";
export const state = new AppState;