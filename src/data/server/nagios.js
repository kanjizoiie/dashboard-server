import axios from 'axios';
import path from 'path';
import database from './database';

let auth = require('../../json/nagios.json');
class Nagios {
    static instance = null;
    constructor(serverHost) {
        if (!this.instance) {
            this.instance = this;
        }
        this.server = serverHost;
        this.database = new database();
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
                return axios.get(this.server + '/nagios/cgi-bin/statusjson.cgi?query=service&hostname=' + nagiosHostname + '&servicedescription=' + description, {
                    auth: auth
                })
                .then((response, reason) => {
                    if (response.data.data.service !== undefined) {
                        resolve(response.data.data.service.plugin_output);
                    }
                    else {
                        reject('Could not fetch nagios data');
                    }
                });
            }
            catch (error) {
                reject(error)
            }
        })
    }

    getNetworkThroughput(serverId) {
        return this.database.getDatabase().then((db) => {
            return db.get('SELECT * FROM servers WHERE (id = ?)', serverId)
            .then((row) => {
                return fetchNagiosData(row.nagios, "Network+Throughput")
                .then((response) => {
                    let res = response.split(' ');
                    return ({
                        in: Number(res[4]),
                        out: Number(res[2])
                    });
                })
                .catch((reason) => console.log(reason));
            });
        });
    }
    
    getCpuLoad(serverId) {
        return this.database.getDatabase().then((db) => {
            return db.get('SELECT * FROM servers WHERE (id = ?)', serverId)
            .then((row) => {
                return fetchNagiosData(row.nagios, "CPU+Load")
                .then((response) => {
                    let res = response.replace(/,/g, '');
                    res = res.split(' ');
                    return ({
                        one: Number(res[4]),
                        five: Number(res[5]),
                        fifteen: Number(res[6])
                    });
                })
                .catch((reason) => console.log(reason));
            });
        });
    }
    
    getMemoryLoad(serverId) {
        return this.database.getDatabase().then((db) => {
            return db.get('SELECT * FROM servers WHERE (id = ?)', serverId)
            .then((row) => {
                return fetchNagiosData(row.nagios, "Memory")
                .then((response) => {
                    let res = response.replace(/%/g, '');
                    res = res.split(' ');
                    return (Number(res[3] / 100));
                })
                .catch((reason) => console.log(reason));
            });
        });
    }
}

export default Nagios;