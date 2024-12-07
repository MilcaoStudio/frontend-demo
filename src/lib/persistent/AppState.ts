import { AccountCollection } from "./collections/AccountCollection";

export default class AppState {
    accounts = new AccountCollection;
    constructor() {
    }
    
}