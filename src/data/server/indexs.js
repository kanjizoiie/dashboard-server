import express from 'express';
import moment from 'moment';
import ping from 'ping';
import google from 'googleapis';
import sqlite from 'sqlite';
import fileSystem from 'fs';
import axios from 'axios';
import path from 'path';

//Json files
let googleOAuth2 = require('../../json/googleAccount.json');
let tokens = require('../../json/google.json');
let auth = require('../../json/nagios.json');

//Create a new router.
let router = express.Router();

//Open the sqlite database
const dbPromise = sqlite.open('./src/database/database.sqlite', { Promise });

//Google Oauth2 stuff
let OAuth2 = google.auth.OAuth2;
let analytics = google.analyticsreporting('v4');
let oauth2Client = new OAuth2(
    googleOAuth2.installed.client_id,
    googleOAuth2.installed.client_secret,
    googleOAuth2.installed.redirect_uris[1]
);
oauth2Client.credentials = tokens;
let url = oauth2Client.generateAuthUrl({
    scope: 'https://www.googleapis.com/auth/analytics.readonly'
});

pingSystem();
/**
 * Periodically run function that pings the different servers.
 */
function pingSystem() {
    dbPromise.then((db) => {
        db.all('SELECT * FROM servers WHERE hostname IS NOT null').then((rows) => {
            rows.forEach((row) => {
                ping.sys.probe(row.hostname, (currentlyUp, error) => {
                    dbPromise.then((db) => {
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
    setTimeout(pingSystem, 8000);
}

/**
 * This function will fetch some plugin data from the servers nagios implementation.
 * 
 * @param {any} serverId The server which you are supposed to fetch data from.
 * @param {any} description The data you want to fetch
 * @returns 
 */
function fetchNagiosData(nagiosHostname, description) {
    return new Promise((resolve, reject) => {
        try {
            return axios.get('https://overlord.realsprint.com/nagios/cgi-bin/statusjson.cgi?query=service&hostname=' + nagiosHostname + '&servicedescription=' + description, {
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

function getTraffic(serverId) {
    return dbPromise.then((db) => {
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

function getCPULoad(serverId) {
    return dbPromise.then((db) => {
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

function getMemory(serverId) {
    return dbPromise.then((db) => {
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

nagiGet();
function nagiGet() {
    dbPromise.then((db) => {
        db.all('SELECT * FROM SERVERS WHERE (nagios IS NOT null)').then((rows) => {
            rows.forEach((row) => {
                Promise.all([
                    getTraffic(row.id),
                    getCPULoad(row.id),
                    getMemory(row.id),
                ]).then((values) => {
                    try {
                        dbPromise.then((db) => {
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
    setTimeout(nagiGet, 10000);
}

/**
 * Fetches Google analytics data from the authorized google account.
 * @param {any} reportRequest This follows the reportRequest structure for batchGet requests in google analytics.
 * @returns Promise of with the resolved report.
 */
function fetchGoogleReport(reportRequest) {
    return new Promise((resolve, reject) => {
        try {
            analytics.reports.batchGet({
                resource: {
                    reportRequests: reportRequest
                },
                auth: oauth2Client
            }, function (error, response) {
                if (error !== null) {
                    reject(error);
                }
                else {
                    resolve(response);
                }
            });
        }
        catch (error) {
            reject(error);
        }
    });
}

/**
 * Calls the fetchGoogleReport function, and asks for user data at the current moment.
 * @param {any} server The server which is asked for.
 * @returns A promise with the usernumber as the resolved data.
 */
function getUsers(serverId) {
    return dbPromise.then((db) => {
        return db.get('SELECT * FROM servers WHERE id = ?', serverId)
        .then((row) => {
            return fetchGoogleReport(
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

googGet();
function googGet() {
    dbPromise.then((db) => {
        db.all('SELECT * FROM SERVERS WHERE (viewId IS NOT null)').then((rows) => {
            rows.forEach((row) => {
                getUsers(row.id).then((values) => {
                    try {
                        dbPromise.then((db) => {
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



/**
 * Calculates the uptime from the ping system.
 * @param {any} serverId The id of the server of which we want to get the ping.
 * @returns A promise with the uptime object as the resolved value.
 */
function getUptimeThisMonth(serverId) {
    return dbPromise.then((db) => {
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
function getAlerts(serverId) {
    return dbPromise.then((db) => {
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

function getHostName(serverId) {
    return dbPromise.then((db) => {
        return db.get('SELECT * FROM servers WHERE (id = ?)', serverId)
        .then((row) => {
            return row.hostname;
        });
    });
}

function getUp(serverId) {
    return dbPromise.then((db) => {
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

function getUsers(serverId) {
    return dbPromise.then((db) => {
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

let code = undefined;
//Routes
router.get('/auth', (req, res, next) => {
    if (req.query.code === undefined) {
        res.redirect(url);
    }
    else {
        code = req.query.code;
        new Promise((resolve, reject) => {
            oauth2Client.getToken(code, function (err, tok) {
                if(tok !== null)
                    resolve(tok);
                if(err !== null)
                    reject(err)
            });
        })
        .then((result) => {
            oauth2Client.credentials = result;
            fileSystem.writeFile(__dirname + '/tokens.json', JSON.stringify(result, null, 1), { flag: fileSystem.O_TRUNC }, (err) => {
                if(err)
                   return console.log('Token writing error: ' + err);
                console.log('Saved the new access token!');
            });
            res.redirect(req.baseUrl);
        }).catch((error) => console.log(error));
    }
});

// The default path.
router.get('/', (req, res, next) => {
    dbPromise.then((db) => {
        db.all('SELECT id FROM servers').then((rows) => {
            let arr = []
            rows.forEach((row) => {
                arr.push(row.id);
            });
            return arr;
        }).then((value) => {
            res.json(value);
        });
    });
})

router.get('/:id', (req, res, next) => {
    Promise.all([
        getUptimeThisMonth(req.params.id),
        getAlerts(req.params.id),
        getHostName(req.params.id),
        getUp(req.params.id),
        getUsers(req.params.id)
    ]).then((values) => {
        try {
            res.json({
                uptime: values[0],
                alerts: values[1],
                hostname: values[2],
                up: values[3],
                users: values[4]
            });
        }
        catch (error) {
            res.send('There was no server at this index');
        }
    })
    .catch((reason) => console.log('ERROR: ' + reason));
});

router.get('/:id/graph', (req, res, next) => {
    let traffic =  { time: [], in: [], out: [] };
    let server =  { time: [], cpu: [], mem: [] };
    dbPromise.then((db) => {
        Promise.all([
            db.all('SELECT * FROM traffic WHERE id = ? ORDER BY insertionDate DESC LIMIT 20 ', req.params.id).then((rows) => {
                rows.forEach((row) => {
                    traffic.out.push(row.outgoing);
                    traffic.in.push(row.ingoing);
                    traffic.time.push(new Date(row.insertionDate));
                });
            }),
            db.all('SELECT * FROM cpu WHERE id = ? ORDER BY insertionDate DESC LIMIT 20', req.params.id).then((rows) => {
                rows.forEach((row) => {
                    server.cpu.push(row.one * 100);
                    server.time.push(new Date(row.insertionDate));
                });
            }),
            db.all('SELECT * FROM memory WHERE id = ? ORDER BY insertionDate DESC LIMIT 20', req.params.id).then((rows) => {
                rows.forEach((row) => {
                    server.mem.push(row.memory * 100);
                });
            })
        ]).then(() => {
            res.json({
                traffic,
                server
            });
        });
    });
});

module.exports = router;