import { ChannelCollection } from "./Channel";

export class LocalClient {
    channels = new ChannelCollection;
}

const client = new LocalClient;
export function useClient() {
    return client;
}