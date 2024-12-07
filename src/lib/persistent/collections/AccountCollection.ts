import { SvelteMap } from "svelte/reactivity";
import { fromStore, get, writable, type Writable } from "svelte/store";
import { User } from "uprising.js";
import type { User as IUser } from "$lib/uprising.js/API";

export class AccountSettings {
    private user: Writable<User>;
    constructor(user: User) {
        this.user = writable(user);
    }

    get current() {
        return fromStore(this.user).current;
    }

    set username(username: string) {
        this.user.update((actual) => {
            actual.username = username;
            return actual;
        });
    }

    set displayName(displayName: string) {
        this.user.update((actual) => {
            actual.displayName = displayName;
            return actual;
        });
    }

    toJSON(): IUser {
        const current = get(this.user);
        return {
            id: current.id,
            username: current.username,
            display_name: current.displayName,
            status: current.status,
            avatar: current.avatar,
        }
    }
}

type Data = {
    accounts: IUser[]
}

export class AccountCollection {
    private accounts: Map<string, AccountSettings> = new SvelteMap;

    getAccount(id: string) {
        return this.accounts.get(id);
    }
    
    setAccount(user: User) {
        this.accounts.set(user.id, new AccountSettings(user));
    }

    removeAccount(id: string) {
        this.accounts.delete(id);
    }

    hydrate(data: Data) {
        if (Array.isArray(data.accounts)) {
            data.accounts.forEach((d) => this.setAccount(new User(d)));
        };
    }

    toJSON() {
        return {
            accounts: Array.from(this.accounts.values()).map((a) => a.toJSON())
        }
    }
}