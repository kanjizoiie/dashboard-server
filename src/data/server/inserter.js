import ping from 'ping';
import moment from 'moment';
import google from './google';
import nagios from './nagios';
import database from './database';


class Inserter {
    constructor() {
        this.database = new database();
        this.dbPromise = this.database.getDatabase();


        this.g = new google();
        this.n = new nagios('overlord.realsprint.com');

        this.pings();
        this.google();
        this.nagios();
    }

    /**
     * Calls the fetchGoogleReport function, and asks for user data at the current moment.
     * @param {any} server The server which is asked for.
     * @returns A promise with the usernumber as the resolved data.
     */
    getUsers(serverId) {
        return this.dbPromise.then((db) => {
            return db.get('SELECT * FROM servers WHERE id = ?', serverId)
                .then((row) => {
                    return this.g.batchGet(
                        [{
                            viewId: row.viewId,
                            dateRanges: [{
                                startDate: moment().format('YYYY-MM-DD'),
                                endDate: moment().format('YYYY-MM-DD')
                            }],
                            metrics: [{
                                expression: 'ga:newUsers'
                            }]
                        }])
                        .then((result) => {
                            return(Number(result.data.reports[0].data.totals[0].values[0]));
                        })
                        .catch(console.error);
                })
                .catch(console.error);
        })
        .catch(console.error);
    }

    getUp(serverId) {
        return this.dbPromise.then((db) => {
            return db.all('SELECT * FROM pings WHERE (id = ?) ORDER BY insertionDate DESC LIMIT 3', serverId)
                .then((rows) => {
                    return new Promise((resolve) => {
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
                        })
                        .catch(console.error);
                })
                .catch(console.error);
        })
        .catch(console.error);
    }

    pings() {
        this.dbPromise.then((db) => {
            db.all('SELECT * FROM SERVERS WHERE hostname IS NOT null').then((rows) => {
                rows.forEach((row) => {
                    ping.sys.probe(row.hostname, (currentlyUp, error) => {
                        db.run('INSERT INTO pings(id, up, insertionDate) VALUES (?, ?, DATETIME("NOW"))', row.id, currentlyUp);
                    });
                    this.getUp(row.id)
                        .then((value) => {
                            db.run('INSERT INTO status (id, status, insertionDate) VALUES (?, ?, DATETIME("NOW"))', row.id, value);
                        })        
                        .catch(console.error);;
                });
            })        
            .catch(console.error);;
        })
        .catch(console.error);
        setTimeout(this.pings.bind(this), 5000);
    }

    nagios() {
        this.dbPromise.then((db) => {
            db.all('SELECT * FROM SERVERS WHERE (nagios IS NOT null)').then((rows) => {
                rows.forEach((row) => {
                    Promise.all([
                        this.n.getNetworkThroughput(row.id),
                        this.n.getCpuLoad(row.id),
                        this.n.getMemoryLoad(row.id),
                        this.n.getHTTPStatus(row.id)
                    ]).then((values) => {
                        let d = new Date();
                        try {
                            db.run('INSERT INTO traffic (id, ingoing, outgoing, insertionDate) VALUES (?, ?, ?, ?)', row.id, values[0].in, values[0].out, d.toISOString());
                            db.run('INSERT INTO cpu (id, one, five, fifteen, insertionDate) VALUES (?, ?, ?, ?, ?)', row.id, values[1].one, values[1].five, values[1].fifteen, d.toISOString());
                            db.run('INSERT INTO memory (id, memory, insertionDate) VALUES (?, ?, ?)', row.id, values[2], d.toISOString());
                            db.run('INSERT INTO httpstatus (id, status, message, insertionDate) VALUES (?, ?, ?, ?)', row.id, values[3].status, values[3].message, d.toISOString());
                        } catch (error) {
                            console.warn('Could not insert nagios data into database - ' + error);
                        }
                    })
                    .catch(console.error);
                });
            })
            .catch(console.error);
        })
        .catch(console.error);
        setTimeout(this.nagios.bind(this), 30000);
    }


    google() {
        this.dbPromise.then((db) => {
            db.all('SELECT * FROM SERVERS WHERE (viewId IS NOT null)').then((rows) => {
                rows.forEach((row) => {
                    this.getUsers(row.id).then((values) => {
                        db.run('INSERT INTO users (id, current, insertionDate) VALUES (?, ?, DATETIME("NOW"))', row.id, values);
                    });
                });
            })
            .catch(console.error);
        })
        .catch(console.error);
        setTimeout(this.google.bind(this), 15000);
    }
}

export default Inserter;