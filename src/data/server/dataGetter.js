import google from './google';
import nagios from './nagios';
import moment from 'moment'
import database from './database';

class DataGetter {
    constructor() {
        this.database = new database();
        this.dbPromise = this.database.getDatabase();
        this.nagiosFetcher = new nagios('https://overlord.realsprint.com');
        this.googleFetcher = new google();
    }

    getServersArray() {
        return this.dbPromise.then((db) => {
            return db.all('SELECT id FROM servers').then((rows) => {
                let arr = []
                rows.forEach((row) => {
                    arr.push(row.id);
                });
                return arr;
            });
        });
    }

    getUsers(serverId) {
        return this.dbPromise.then((db) => {
            return db.get('SELECT current FROM users WHERE id = ? ORDER BY insertionDate DESC LIMIT 1', serverId)
            .then((value) => {
                if (value !== undefined) {
                    return value.current;
                }
                else {
                    return undefined;
                }
            })
        })
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
                    if(row.status == 1 || row.status == 2) {
                        count += 1;
                    }
                });
                uptime = count / rows.length;
                return uptime;
            });
        });
    }

    /**
     * 
     * Checks the parameters for errors which it should alert for then fill the alert array!
     * @param {any} server The server which is asked for.
     * @returns a promise which resolves in the alert array.
     */
    getAlerts(serverId) {
        return this.dbPromise.then((db) => {
            let alerts = []
            return db.all('SELECT * FROM alerts WHERE id = ? ORDER BY insertionDate DESC LIMIT 5', serverId)
            .then((rows) => {
                rows.forEach((row) => {
                    db.get('SELECT * FROM alertTypes WHERE code = ?', row.code).then((alert) => alerts.push({
                            alert: alert,
                            datetime: row.insertionDate
                    }));
                });
                return alerts;
            });
        });
    }

    getHostName(serverId) {
        return this.dbPromise.then((db) => {
            return db.get('SELECT * FROM servers WHERE (id = ?)', serverId)
            .then((row) => {
                return row.hostname;
            }).catch( err => console.log(err));
        });
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
                    if(result !== undefined) {
                        if (!rows[0].up) {
                            return 1;
                        }
                        else {
                            return 2;
                        }
                    }
                    else {
                        return 0;
                    }
                });
            })
        });
    }

    getGraphs(serverId) {
        let traffic =  { time: [], in: [], out: [] };
        let server =  { time: [], cpu: [], mem: [] };
        return this.dbPromise.then((db) => {
            return Promise.all([
                db.all('SELECT * FROM traffic WHERE id = ? ORDER BY insertionDate DESC LIMIT 10', serverId).then((rows) => {
                    rows.forEach((row) => {
                        traffic.out.push(row.outgoing);
                        traffic.in.push(row.ingoing);
                        traffic.time.push(new Date(row.insertionDate));
                    });
                }),
                db.all('SELECT * FROM cpu WHERE id = ? ORDER BY insertionDate DESC LIMIT 10', serverId).then((rows) => {
                    rows.forEach((row) => {
                        server.cpu.push(row.one * 100);
                        server.time.push(new Date(row.insertionDate));
                    });
                }),
                db.all('SELECT * FROM memory WHERE id = ? ORDER BY insertionDate DESC LIMIT 10', serverId).then((rows) => {
                    rows.forEach((row) => {
                        server.mem.push(row.memory * 100);
                    });
                })
            ]).then(() => {
                return ({
                    traffic: traffic,
                    server: server
                });
            });
        });
    }
}

export default DataGetter;