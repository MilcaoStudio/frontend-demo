export interface User {
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