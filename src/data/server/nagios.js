import axios from 'axios';
let auth = require('./nagios.json');
class Nagios {
    constructor(serverHost, name, description) {
        this.server = serverHost;
        this.name = name;
        this.description = description;
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
}