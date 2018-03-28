import axios from 'axios';
import path from 'path';
import database from './database';

let auth = require(path.resolve('src/json/nagios.json'));
class Nagios {
    static instance = null;
    constructor(serverHost) {
        if (!this.instance) {
            this.instance = this;
        }
        this.server = serverHost;
        this.database = new database();
        this.dbPromise = this.database.getDatabase();
        return this.instance;
    }
    

    /**
     * This function will fetch some plugin data from the servers nagios implementation.
     * 
     * @param {any} serverId The server which you are supposed to fetch data from.
     * @param {any} description The data you want to fetch
     * @returns 
     */
    fetchNagiosData(nagiosHostname, description) {
        return new Promise((resolve, reject) => {
            try {
                return axios.get('https://' + this.server + '/nagios/cgi-bin/statusjson.cgi?query=service&hostname=' + nagiosHostname + '&servicedescription=' + description, {
                    auth: auth
                })
                .then((response, reason) => {
                    if (response.data.data.service !== undefined) {
                        resolve(response.data.data.service.plugin_output);
                    }
                    else {
                        reject(response.data.result.message);
                    }
                }).catch(console.error);
            }
            catch (error) {
                reject(error)
            }
        })
    }

    getHTTPStatus(serverId) {
        return this.dbPromise.then((db) => {
            return db.get('SELECT * FROM servers WHERE (id = ?)', serverId)
            .then((row) => {
                return this.fetchNagiosData(row.nagios, "HTTP")
                .then((response) => {
                    let res = response.replace(/:/g, '');
                    res = res.split(' ');
                    return ({
                        status: res[1],
                        message: response
                    });
                })
                .catch((error) => {
                    console.error(error + ' -> Trying HTTPS instead');
                    return this.fetchNagiosData(row.nagios, "HTTPS")
                    .then((response) => {
                        let res = response.replace(/:/g, '');
                        res = res.split(' ');
                        return ({
                            status: res[1],
                            message: response
                        });
                    })
                    .catch(console.error);
                });
            })
            .catch(console.error);
        })
        .catch(console.error);
    }

    getNetworkThroughput(serverId) {
        return this.dbPromise.then((db) => {
            return db.get('SELECT * FROM servers WHERE (id = ?)', serverId)
            .then((row) => {
                return this.fetchNagiosData(row.nagios, "Network+Throughput")
                .then((response) => {
                    let res = response.split(' ');
                    return ({
                        in: Number(res[4]),
                        out: Number(res[2])
                    });
                })
                .catch(console.error)
            });
        });
    }
    
    getCpuLoad(serverId) {
        return this.dbPromise.then((db) => {
            return db.get('SELECT * FROM servers WHERE (id = ?)', serverId)
            .then((row) => {
                return this.fetchNagiosData(row.nagios, "CPU+Load")
                .then((response) => {
                    let res = response.replace(/,/g, '');
                    res = res.split(' ');
                    return ({
                        one: Number(res[4]),
                        five: Number(res[5]),
                        fifteen: Number(res[6])
                    });
                })
                .catch(console.error)
            });
        });
    }
    
    getMemoryLoad(serverId) {
        return this.dbPromise.then((db) => {
            return db.get('SELECT * FROM servers WHERE (id = ?)', serverId)
            .then((row) => {
                return this.fetchNagiosData(row.nagios, "Memory")
                .then((response) => {
                    let res = response.replace(/%/g, '');
                    res = res.split(' ');
                    return (Number(res[3] / 100));
                })
                .catch(console.error)
            });
        });
    }
}



export default Nagios;