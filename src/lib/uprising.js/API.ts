export interface User {
    avatar: string|null
    id: string
    username: string
    display_name: string|null
    status: UserStatus
}

export interface UserStatus {
    mode: StatusMode
    text: string|null
}

export enum StatusMode {
    ONLINE = "online",
    FOCUS = "focus",
    DND = "dnd",
    OFFLINE = "offline",
}

export interface Channel {
    id: string
    name: string
    type: "text" | "voice" | "dm"
    server: string
    description: string | null
}