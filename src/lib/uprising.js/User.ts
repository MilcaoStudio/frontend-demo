import { StatusMode, type UserStatus, type User as IUser } from "./API";

export class User {
    private _id: string;
    displayName: string|null;
    username: string;
    private _status: UserStatus;
    constructor(data: IUser) {
        this._id = data.id;
        this.displayName = data.display_name;
        this.username = data.username;
        this._status = data.status;
    }

    static create(data: {id: string, username: string, display_name?: string}){
        return new User({
            id: data.id,
            username: data.username,
            display_name: data.display_name ?? null,
            status: {
                mode: StatusMode.OFFLINE,
                text: null
            },
        });
    }

    get id() {
        return this._id;
    }

    get status() {
        return this._status;
    }

    updateStatus(status: Partial<UserStatus>) {
        if (status.mode) {
            this._status.mode = status.mode;
        }
        if (status.text) {
            this._status.text = status.text;
        }
    }

}