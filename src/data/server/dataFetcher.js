class DataFetcher {
    constructor(path) {
        this.dbpromise = sqlite.open(path, { Promise });
        this.pingGet();
        this.nagiosGet();
        this.googleGet();
    }

    pingSystem() {
        this.dbpromise.then((db) => {
            db.all('SELECT * FROM SERVERS WHERE hostname IS NOT null').then((rows) => {
                rows.forEach((row) => {
                    ping.sys.probe(row.hostname, (currentlyUp, error) => {
                        this.dbpromise.then((db) => {
                            db.run('INSERT INTO pings(id, up, insertionDate) VALUES (?, ?, DATETIME("now"))', row.id, currentlyUp);
                        });
                        if (error !== null) {
                            console.log(error);
                        }
                    });
                    getUp(row.id)
                    .then((value) => {
                        db.run('INSERT INTO status (id, status, insertionDate) VALUES (?, ?, DATETIME("now"))', row.id, value);
                    })
                });
            });
        });
        setTimeout(pingSystem, 5000);
    }

    nagiGet() {
        this.dbpromise.then((db) => {
            db.all('SELECT * FROM SERVERS WHERE (nagios IS NOT null)').then((rows) => {
                rows.forEach((row) => {
                    Promise.all([
                        getTraffic(row.id),
                        getCPULoad(row.id),
                        getMemory(row.id),
                    ]).then((values) => {
                        try {
                            this.dbpromise.then((db) => {
                                db.run('INSERT INTO traffic (id, ingoing, outgoing, insertionDate) VALUES (?, ?, ?, DATETIME("now"))', row.id, values[0].in, values[0].out);
                                db.run('INSERT INTO cpu (id, one, five, fifteen, insertionDate) VALUES (?, ?, ?, ?, DATETIME("now"))', row.id, values[1].one, values[1].five, values[1].fifteen);
                                db.run('INSERT INTO memory (id, memory, insertionDate) VALUES (?, ?, DATETIME("now"))', row.id, values[2]);
                            });
                        }
                        catch (error) {
                            console.log(error);
                        }
                    });
                });
            });
        });
        setTimeout(nagiGet, 5000);
    }


    googGet() {
        this.dbpromise.then((db) => {
            db.all('SELECT * FROM SERVERS WHERE (viewId IS NOT null)').then((rows) => {
                rows.forEach((row) => {
                    getUsers(row.id).then((values) => {
                        try {
                            this.dbpromise.then((db) => {
                                db.run('INSERT INTO users (id, current, insertionDate) VALUES (?, ?, DATETIME("now"))', row.id, values);
                            });
                        }
                        catch (error) {
                            console.log(error);
                        }
                    });
                });
            });
        });
        setTimeout(googGet, 15000);
    }
}

export default DataFetcher;