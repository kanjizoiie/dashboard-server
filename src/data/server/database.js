import sqlite from 'sqlite';
import path from 'path';

class Database {
    constructor() {
        if (!this.instance) {
            this.instance = this;
        }
        this.dbPromise = sqlite.open(path.resolve('src/database/database.sqlite'), { Promise, cached: true });
        return this.instance;   
    }

    getDatabase() {
        return this.dbPromise;
    }
}

export default Database;