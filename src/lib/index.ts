// place files you want to import through the `$lib` alias in this folder.
import { SvelteMap } from "svelte/reactivity"
import type { User } from "uprising.js";
import AppState from "./persistent/AppState";

export interface Channel {
    id: string
    name: string
    type: "text" | "voice" | "dm"
    server: string
    description: string | null
}

const channels: Channel[] = [
    { id: "01JB56QAJR6T3ZP14HVCE52KVN", name: "General", server: "01HRSZB6J5PW9D2XGBZVZAKGFA", type: "text", description: "This is a general chat room for the server." },
    { id: "01JB56QAJSJGNSCHA5FY409T8E", name: "Gaming Room", server: "01HRSZB6J5PW9D2XGBZVZAKGFA", "type": "voice", description: null },
    { id: "01JB56QAJS0CKZG7NGDDVYD1WZ", name: "Gaming Room", server: "01HRSZB6J5PW9D2XGBZVZAKGFA",  "type": "voice", description: null},
    { id: "01JB56QAJSD16YZ38X7NY5RCNW", name: "Music", server: "01HRSZB6J5PW9D2XGBZVZAKGFA", "type": "voice", description: null },
    { id: "01JB56QAJS4AJH74QTPPHX4CQX", name: "Music", server: "01HRSZB6J5PW9D2XGBZVZAKGFA", "type": "voice", description: null },
];

export function getChannel(id: string) {
    return channels.find(c => c.id == id)
}

export class Server {
    constructor(public readonly id: string) {}
    get channels() {
        return channels.filter(c => c.server == this.id );
    }
}

export const users: Map<string, User> = new SvelteMap;
export const server = new Server("01HRSZB6J5PW9D2XGBZVZAKGFA");
export const lastChannel = "01JB56QAJR6T3ZP14HVCE52KVN";
export const state = new AppState;