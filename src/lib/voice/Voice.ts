export interface VideoConstraints {
    [name: string]: {
        resolution: MediaTrackConstraints;
        encodings: RTCRtpEncodingParameters;
    };
}

export const VideoConstraints: VideoConstraints = {
    qvga: {
        resolution: {
            width: { ideal: 320 },
            height: { ideal: 180 },
            frameRate: {
                ideal: 15,
                max: 30,
            },
        },
        encodings: {
            maxBitrate: 150_000,
            maxFramerate: 15.0,
        },
    },
    vga: {
        resolution: {
            width: { ideal: 640 },
            height: { ideal: 360 },
            frameRate: {
                ideal: 30,
                max: 60,
            },
        },
        encodings: {
            maxBitrate: 500_000,
            maxFramerate: 30.0,
        },
    },
    shd: {
        resolution: {
            width: { ideal: 960 },
            height: { ideal: 540 },
            frameRate: {
                ideal: 30,
                max: 60,
            },
        },
        encodings: {
            maxBitrate: 1_200_000,
            maxFramerate: 30.0,
        },
    },
    hd: {
        resolution: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: {
                ideal: 30,
                max: 60,
            },
        },
        encodings: {
            maxBitrate: 2_500_000,
            maxFramerate: 30.0,
        },
    },
    fhd: {
        resolution: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: {
                ideal: 30,
                max: 60,
            },
        },
        encodings: {
            maxBitrate: 4_000_000,
            maxFramerate: 30.0,
        },
    },
    qhd: {
        resolution: {
            width: { ideal: 2560 },
            height: { ideal: 1440 },
            frameRate: {
                ideal: 30,
                max: 60,
            },
        },
        encodings: {
            maxBitrate: 8_000_000,
            maxFramerate: 30.0,
        },
    },
};

export interface Sender {
    stream: MediaStream;
    transceivers: { [kind in 'video' | 'audio']: RTCRtpTransceiver };
}

export interface Trickle {
    candidate: RTCIceCandidateInit;
    target: Role;
}

export interface ActiveLayer {
    streamId: string;
    activeLayer: string;
    availableLayers: string[];
}

export enum Role {
    pub = 0,
    sub = 1,
}

export type Transports<T extends string | symbol | number, U> = {
    [K in T]: U;
};

export enum WSEventType {
    Accept = "Accept",
    Answer = "Answer",
    UserJoin = "UserJoin",
    UserLeft = "UserLeft",

    Offer = "Offer",
    Trickle = "Trickle",

    UserStartProduce = "UserStartProduce",
    UserStopProduce = "UserStopProduce",
}

export enum WSCommandType {
    Connect = "Connect",
    Answer = "Answer",
    Join = "Join",
    Offer = "Offer",
    Trickle = "Trickle",
    Leave = "Leave",

    InitializeTransports = "InitializeTransports",
    ConnectTransport = "ConnectTransport",

    StartProduce = "StartProduce",
    StopProduce = "StopProduce",

    StartConsume = "StartConsume",
    StopConsume = "StopConsume",
    SetConsumerPause = "SetConsumerPause",
}

export enum WSErrorCode {
    NotConnected = 0,
    NotFound = 404,

    TransportConnectionFailure = 601,

    ProducerFailure = 611,
    ProducerNotFound = 614,

    ConsumerFailure = 621,
    ConsumerNotFound = 624,
}

export enum WSCloseCode {
    // Sent when the received data is not a string, or is unparseable
    InvalidData = 1003,
    Unauthorized = 4001,
    RoomClosed = 4004,
    // Sent when a client tries to send an opcode in the wrong state
    InvalidState = 1002,
    ServerError = 1011,
}

export interface VoiceError {
    error: WSErrorCode | WSCloseCode;
    message: string;
}

export interface AuthenticationResult {
    userId: string;
    partipants: string[];
}

export interface VoiceUser {
    audio?: boolean;
}

export type MediaType = "audio" | "video" | "screencast";