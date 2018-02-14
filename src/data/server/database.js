import sqlite from 'sqlite';

class Database {
    static instance = null;
    constructor() {
        if (!this.instance) {
            this.instance = this;
        }
        this.dbPromise = sqlite.open('./src/database/database.sqlite', { Promise });
        return this.instance;   
    }
    async getDatabase() {
        return this.dbPromise;
    }
}

export default Database;