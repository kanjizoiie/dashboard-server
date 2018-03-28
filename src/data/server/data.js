import database from './database';

class Data {
    constructor() {
        this.database = new database();
        this.dbPromise = this.database.getDatabase();
    }

    getServersArray() {
        return this.dbPromise.then((db) => {
            return db.all('SELECT id FROM servers').then((rows) => {
                return rows;
            });
        });
    }

    getRecentAlerts() {
        return this.dbPromise.then((db) => {
            return db.all('SELECT * FROM alerts ORDER BY insertionDate DESC LIMIT 5').then((rows) => {
                return rows;
            })
            .catch(console.error);
        })
        .catch(console.error);
    }

    getUsers(serverId) {
        return this.dbPromise.then((db) => {
            return db.get('SELECT current FROM users WHERE id = ? ORDER BY insertionDate DESC LIMIT 1', serverId)
                .then((value) => {
                    if (value.current)
                        return value.current;
                    else 
                        return undefined;
                })
                .catch(console.error);
        })
        .catch(console.error);
    }

    /**
     * Calculates the uptime from the ping system.
     * @param {any} serverId The id of the server of which we want to get the ping.
     * @returns A promise with the uptime object as the resolved value.
     */
    getUptimeThisMonth(serverId) {
        return this.dbPromise.then((db) => {
            let count = 0;
            let uptime = 0;
            return db.all('SELECT * FROM status WHERE id = ? AND insertionDate BETWEEN DATETIME("now", "start of month") AND DATETIME("now", "localtime")', serverId)
                .then((rows) => {
                    rows.forEach((row) => {
                        if (row.status == 1 || row.status == 2) {
                            count += 1;
                        }
                    });
                    uptime = count / rows.length;
                    return uptime;
                })
                .catch(console.error);
        })
        .catch(console.error);
    }

    /**
     * 
     * Checks the parameters for errors which it should alert for then fill the alert array!
     * @param {any} server The server which is asked for.
     * @returns a promise which resolves in the alert array.
     */
    getAlerts(serverId) {
        return this.dbPromise.then((db) => {
            return db.all('SELECT alerts.id, alerts.insertionDate, alertTypes.code, alertTypes.severity, alertTypes.message FROM alerts INNER JOIN alertTypes ON alertTypes.code = alerts.code AND alerts.id = ?', serverId)
                .then((rows) => {
                    return rows;
                })
                .catch(console.error);
        })
        .catch(console.error);
    }

    getHostName(serverId) {
        return this.dbPromise.then((db) => {
            return db.get('SELECT hostname FROM servers WHERE (id = ?)', serverId)
                .then((row) => {
                    return row;
                })
                .catch(console.error);
        })
        .catch(console.error);
    }

    getUp(serverId) {
        return this.dbPromise.then((db) => {
            return db.all('SELECT * FROM pings WHERE (id = ?) ORDER BY insertionDate DESC LIMIT 3', serverId)
                .then((rows) => {
                    return new Promise((resolve, reject) => {
                        resolve(rows.find((val) => {
                            return val.up;
                        }));
                    })
                        .then((result) => {
                            if (result !== undefined) {
                                if (!rows[0].up) {
                                    return 1;
                                } else {
                                    return 2;
                                }
                            } else {
                                return 0;
                            }
                        });
                })
                .catch(console.error);
        })
        .catch(console.error);
    }

    getGraphs(serverId) {
        return this.dbPromise.then((db) => {
            return Promise.all([
                db.all('SELECT outgoing, ingoing, insertionDate FROM traffic WHERE id = ? ORDER BY insertionDate DESC LIMIT 20', serverId)
                    .then((rows) => {
                        if (rows.length <= 0) {
                            return undefined;
                        }
                        return rows;
                    }),
                db.all('SELECT one, insertionDate FROM cpu WHERE id = ? ORDER BY insertionDate DESC LIMIT 20', serverId)
                    .then((rows) => {
                        if (rows.length <= 0) {
                            return undefined;
                        }
                        return rows;
                    }),
                db.all('SELECT memory FROM memory WHERE id = ? ORDER BY insertionDate DESC LIMIT 20', serverId)
                    .then((rows) => {
                        if (rows.length <= 0) {
                            return undefined;
                        }
                        return rows;
                    })
            ]).then((value) => {
                let empty = false;
                value.forEach((arr) => {
                    if (!arr) {
                        empty = true;
                    }
                });

                if (empty) {                
                    return false;
                }

                let traffic = {
                    time: [],
                    in: [],
                    out: []
                };
                let server = {
                    time: [],
                    cpu: [],
                    mem: []
                };

                value[0].forEach((row) => {
                    traffic.out.push(row.outgoing);
                    traffic.in.push(row.ingoing);
                    traffic.time.push(new Date(row.insertionDate));
                });
                value[1].forEach((row) => {
                    server.cpu.push(row.one * 100);
                    server.time.push(new Date(row.insertionDate));
                });
                value[2].forEach((row) => {
                    server.mem.push(row.memory * 100);
                });

                return ({
                    traffic: traffic,
                    server: server
                });
            })
            .catch(console.error);
        })
        .catch(console.error);
    }
}

export default Data;