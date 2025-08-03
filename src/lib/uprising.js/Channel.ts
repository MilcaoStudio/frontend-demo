import { base } from "$app/paths";
import { type Channel as IChannel } from "./API";

export class Channel {
    name: string;
    description: string | null;
    id: string;
    serverId: string;
    type: IChannel["type"];
    constructor(data: IChannel) {
        this.name = data.name;
        this.id = data.id;
        this.description = data.description;
        this.type = data.type;
        this.serverId = data.server;
    }
    
    get path() {
        return `${base}/channel/${this.id}`;
    }
}

export class ChannelCollection {
    private cache: Map<string, Channel> = new Map;

    constructor(channels?: Iterable<Channel>) {
        if (channels) {
            for (const channel of channels) {
                this._add(channel);
            }
        }
    }
    
    get(id: string) {
        return this.cache.get(id);
    }

    _add(channel: Channel) {
        this.cache.set(channel.id, channel);
    }

    values() {
        return [...this.cache.values()];
    }
}