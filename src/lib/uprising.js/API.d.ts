import { StatusMode } from "./API";

declare module "API" {
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
}