import sqlite from 'sqlite';

class Database {
    constructor() {
        if (!this.instance) {
            this.instance = this;
        }
        this.dbPromise = sqlite.open('./src/database/database.sqlite', { Promise });
        return this.instance;   
    }

    getDatabase() {
        return this.dbPromise;
    }
}

export default Database;