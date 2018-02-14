import ping from 'ping'
import google from './google';
import nagios from './nagios';
import database from './database';

class DataFetcher {
    constructor(path) {
        this.pings();
        this.nagios();
        this.google();
        this.database = new database();
        this.dbpromise = this.database.getDatabase();
        this.g = new google();
        this.n = new nagios();
    }


    /**
     * Calls the fetchGoogleReport function, and asks for user data at the current moment.
     * @param {any} server The server which is asked for.
     * @returns A promise with the usernumber as the resolved data.
     */
    getUsers(serverId) {
        return dbPromise.then((db) => {
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
                    .then((result) => { return (Number(result.reports[0].data.totals[0].values[0])); })
                    .catch((reason) => console.log('Fetch Google Report Error: ' + reason));
            });
        });
    }

    pings() {
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
        setTimeout(this.pings, 15000);
    }

    nagios() {
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
        setTimeout(this.nagios, 15000);
    }


    google() {
        this.dbpromise.then((db) => {
            db.all('SELECT * FROM SERVERS WHERE (viewId IS NOT null)').then((rows) => {
                rows.forEach((row) => {
                    google.getUsers(row.id).then((values) => {
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
        setTimeout(this.google, 15000);
    }
}

export default DataFetcher;