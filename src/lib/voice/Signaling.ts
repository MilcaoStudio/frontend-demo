import EventEmitter from "eventemitter3";

import {
    type AuthenticationResult,
    WSCommandType,
    WSErrorCode,
    type Trickle,
} from "./Voice";

interface SignalingEvents {
    open: (event: Event) => void;
    close: (event: CloseEvent) => void;
    error: (event: Event) => void;
    data: (data: any) => void;

    negociate: (data: any) => void;
    trickle: (data: any) => void;
}

export default class Signaling extends EventEmitter<SignalingEvents> {
    ws?: WebSocket;
    peer?: RTCPeerConnection;
    index: number;
    pending: Map<number, (data: unknown) => void>;

    constructor() {
        super();
        this.index = 0;
        this.pending = new Map();
    }

    connected(): boolean {
        return (
            this.ws != undefined &&
            this.ws.readyState < WebSocket.CLOSING
        );
    }

    async connect(address: string): Promise<void> {
        this.disconnect();
        this.ws = new WebSocket(address);
        this.ws.onopen = (e) => this.emit("open", e);
        this.ws.onclose = (e) => this.emit("close", e);
        this.ws.onerror = (e) => this.emit("error", e);
        this.ws.onmessage = (e) => this.parseData(e);

        let finished = false;
        return new Promise((resolve, reject) => {
            this.once("open", () => {
                if (finished) return;
                finished = true;
                resolve();
            });

            this.once("error", () => {
                if (finished) return;
                finished = true;
                reject();
            });
        });
    }

    disconnect() {
        this.peer?.close();
        if (
            this.ws != undefined &&
            this.ws.readyState != WebSocket.CLOSED &&
            this.ws.readyState != WebSocket.CLOSING
        )
            this.ws.close(1000);
    }

    private parseData(event: MessageEvent) {
        if (typeof event.data != "string") return;
        const json = JSON.parse(event.data);
        const id = json.id;
        if (!id) {
            this.emit("data", json);
            return;
        }
        console.debug("Received:", id, event.data);
        const entry = this.pending.get(id);
        if (!entry) {
            this.emit("data", json);
            return;
        }
        entry(json);
        this.index++;
    }

    answer(description: RTCSessionDescriptionInit) {
        this.send(WSCommandType.Answer, {description});
    }

    join(room_id: string, offer: RTCSessionDescriptionInit) {
        return this.sendRequest(WSCommandType.Join, {room_id, offer})
    }

    leave() {
        this.send(WSCommandType.Leave);
    }

    offer(description: RTCSessionDescriptionInit) {
        return this.sendRequest(WSCommandType.Offer, {description})
    }

    send(type: string, data?: any) {
        console.debug({type, ...data});
        this.ws?.send(`${JSON.stringify({type, ...data})}\n`);
    }

    // Connect -> Accept
    // Join -> Offer
    sendRequest(type: string, data?: any): Promise<any> {
        if (!this.ws || this.ws.readyState != WebSocket.OPEN)
            return Promise.reject({ error: WSErrorCode.NotConnected });

        const ws = this.ws;
        return new Promise((resolve, reject) => {
            if (this.index >= 2 ** 32) this.index = 0;
            while (this.pending.has(this.index)) this.index++;
            const onClose = (e: CloseEvent) => {
                reject({
                    error: e.code,
                    message: e.reason,
                });
            };

            const finishedFn = (data: any) => {
                this.removeListener("close", onClose);
                if (data.error)
                    reject({
                        error: data.error,
                        message: data.message,
                        data: data.data,
                    });
                resolve(data);
            };
            this.index++;
            this.pending.set(this.index, finishedFn);
            this.once("close", onClose);
            const json = {
                id: this.index,
                type,
                ...data,
            };
            console.debug(json);
            ws.send(`${JSON.stringify(json)}\n`);
        });
    }

    trickle(trickle: Trickle) {
        this.send(WSCommandType.Trickle, trickle);
    }
    authenticate(token: string): Promise<AuthenticationResult> {
        return this.sendRequest(WSCommandType.Connect, { token });
    }
}