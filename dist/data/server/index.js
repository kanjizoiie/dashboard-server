'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _ping = require('ping');

var _ping2 = _interopRequireDefault(_ping);

var _googleapis = require('googleapis');

var _googleapis2 = _interopRequireDefault(_googleapis);

var _sqlite = require('sqlite');

var _sqlite2 = _interopRequireDefault(_sqlite);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _google = require('./google');

var _google2 = _interopRequireDefault(_google);

var _nagios = require('./nagios');

var _nagios2 = _interopRequireDefault(_nagios);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//Json files
var googleOAuth2 = require(_path2.default.join(__dirname, '../../json/googleAccount.json'));
var tokens = require(_path2.default.join(__dirname, '../../json/google.json'));
var auth = require(_path2.default.join(__dirname, '../../json/nagios.json'));

//Create a new router.
var router = _express2.default.Router();
//Open the sqlite database
var dbPromise = _sqlite2.default.open(_path2.default.join(__dirname, '../../database/database.sqlite'), { Promise: Promise });

//Google Oauth2 stuff
var OAuth2 = _googleapis2.default.auth.OAuth2;
var analytics = _googleapis2.default.analyticsreporting('v4');
var oauth2Client = new OAuth2(googleOAuth2.installed.client_id, googleOAuth2.installed.client_secret, googleOAuth2.installed.redirect_uris[1]);
oauth2Client.credentials = tokens;
var url = oauth2Client.generateAuthUrl({
    scope: 'https://www.googleapis.com/auth/analytics.readonly'
});

pingSystem();
/**
 * Periodically run function that pings the different servers.
 */
function pingSystem() {
    dbPromise.then(function (db) {
        db.all('SELECT * FROM SERVERS WHERE hostname IS NOT null').then(function (rows) {
            rows.forEach(function (row) {
                _ping2.default.sys.probe(row.hostname, function (currentlyUp, error) {
                    dbPromise.then(function (db) {
                        db.run('INSERT INTO pings(id, up, insertionDate) VALUES (?, ?, DATETIME("now"))', row.id, currentlyUp);
                    });
                    if (error !== null) {
                        console.log(error);
                    }
                });
                getUp(row.id).then(function (value) {
                    db.run('INSERT INTO status (id, status, insertionDate) VALUES (?, ?, DATETIME("now"))', row.id, value);
                });
            });
        });
    });
    setTimeout(pingSystem, 5000);
}

/**
 * This function will fetch some plugin data from the servers nagios implementation.
 * 
 * @param {any} serverId The server which you are supposed to fetch data from.
 * @param {any} description The data you want to fetch
 * @returns 
 */
function fetchNagiosData(nagiosHostname, description) {
    return new Promise(function (resolve, reject) {
        try {
            return _axios2.default.get('https://overlord.realsprint.com/nagios/cgi-bin/statusjson.cgi?query=service&hostname=' + nagiosHostname + '&servicedescription=' + description, {
                auth: auth
            }).then(function (response, reason) {
                if (response.data.data.service !== undefined) {
                    resolve(response.data.data.service.plugin_output);
                } else {
                    reject('Could not fetch nagios data');
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

function getTraffic(serverId) {
    return dbPromise.then(function (db) {
        return db.get('SELECT * FROM servers WHERE (id = ?)', serverId).then(function (row) {
            return fetchNagiosData(row.nagios, "Network+Throughput").then(function (response) {
                var res = response.split(' ');
                return {
                    in: Number(res[4]),
                    out: Number(res[2])
                };
            }).catch(function (reason) {
                return console.log(reason);
            });
        });
    });
}

function getCPULoad(serverId) {
    return dbPromise.then(function (db) {
        return db.get('SELECT * FROM servers WHERE (id = ?)', serverId).then(function (row) {
            return fetchNagiosData(row.nagios, "CPU+Load").then(function (response) {
                var res = response.replace(/,/g, '');
                res = res.split(' ');
                return {
                    one: Number(res[4]),
                    five: Number(res[5]),
                    fifteen: Number(res[6])
                };
            }).catch(function (reason) {
                return console.log(reason);
            });
        });
    });
}

function getMemory(serverId) {
    return dbPromise.then(function (db) {
        return db.get('SELECT * FROM servers WHERE (id = ?)', serverId).then(function (row) {
            return fetchNagiosData(row.nagios, "Memory").then(function (response) {
                var res = response.replace(/%/g, '');
                res = res.split(' ');
                return Number(res[3] / 100);
            }).catch(function (reason) {
                return console.log(reason);
            });
        });
    });
}

nagiGet();
function nagiGet() {
    dbPromise.then(function (db) {
        db.all('SELECT * FROM SERVERS WHERE (nagios IS NOT null)').then(function (rows) {
            rows.forEach(function (row) {
                Promise.all([getTraffic(row.id), getCPULoad(row.id), getMemory(row.id)]).then(function (values) {
                    try {
                        dbPromise.then(function (db) {
                            db.run('INSERT INTO traffic (id, ingoing, outgoing, insertionDate) VALUES (?, ?, ?, DATETIME("now"))', row.id, values[0].in, values[0].out);
                            db.run('INSERT INTO cpu (id, one, five, fifteen, insertionDate) VALUES (?, ?, ?, ?, DATETIME("now"))', row.id, values[1].one, values[1].five, values[1].fifteen);
                            db.run('INSERT INTO memory (id, memory, insertionDate) VALUES (?, ?, DATETIME("now"))', row.id, values[2]);
                        });
                    } catch (error) {
                        console.log(error);
                    }
                });
            });
        });
    });
    setTimeout(nagiGet, 5000);
}

/**
 * Fetches Google analytics data from the authorized google account.
 * @param {any} reportRequest This follows the reportRequest structure for batchGet requests in google analytics.
 * @returns Promise of with the resolved report.
 */
function fetchGoogleReport(reportRequest) {
    return new Promise(function (resolve, reject) {
        try {
            analytics.reports.batchGet({
                resource: {
                    reportRequests: reportRequest
                },
                auth: oauth2Client
            }, function (error, response) {
                if (error !== null) {
                    reject(error);
                } else {
                    resolve(response);
                }
            });
        } catch (error) {
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
    return dbPromise.then(function (db) {
        return db.get('SELECT * FROM servers WHERE id = ?', serverId).then(function (row) {
            return fetchGoogleReport([{
                viewId: row.viewId,
                dateRanges: [{
                    startDate: (0, _moment2.default)().format('YYYY-MM-DD'),
                    endDate: (0, _moment2.default)().format('YYYY-MM-DD')
                }],
                metrics: [{
                    expression: 'ga:newUsers'
                }]
            }]).then(function (result) {
                return Number(result.reports[0].data.totals[0].values[0]);
            }).catch(function (reason) {
                return console.log('Fetch Google Report Error: ' + reason);
            });
        });
    });
}

googGet();
function googGet() {
    dbPromise.then(function (db) {
        db.all('SELECT * FROM SERVERS WHERE (viewId IS NOT null)').then(function (rows) {
            rows.forEach(function (row) {
                getUsers(row.id).then(function (values) {
                    try {
                        dbPromise.then(function (db) {
                            db.run('INSERT INTO users (id, current, insertionDate) VALUES (?, ?, DATETIME("now"))', row.id, values);
                        });
                    } catch (error) {
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
    return dbPromise.then(function (db) {
        var count = 0;
        var uptime = 0;
        return db.all('SELECT * FROM status WHERE id = ? AND insertionDate BETWEEN DATETIME("now", "start of month") AND DATETIME("now", "localtime")', serverId).then(function (rows) {
            rows.forEach(function (row) {
                if (row.status == 1 || row.status == 2) {
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
    return dbPromise.then(function (db) {
        var alerts = [];
        return db.all('SELECT * FROM alerts WHERE id = ? ORDER BY insertionDate DESC LIMIT 5', serverId).then(function (rows) {
            rows.forEach(function (row) {
                db.get('SELECT * FROM alertTypes WHERE code = ?', row.code).then(function (alert) {
                    return alerts.push({
                        alert: alert,
                        datetime: row.insertionDate
                    });
                });
            });
            return alerts;
        });
    });
}

function getHostName(serverId) {
    return dbPromise.then(function (db) {
        return db.get('SELECT * FROM servers WHERE (id = ?)', serverId).then(function (row) {
            return row.hostname;
        });
    });
}

function getUp(serverId) {
    return dbPromise.then(function (db) {
        return db.all('SELECT * FROM pings WHERE (id = ?) ORDER BY insertionDate DESC LIMIT 3', serverId).then(function (rows) {
            return new Promise(function (resolve, reject) {
                resolve(rows.find(function (val) {
                    return val.up;
                }));
            }).then(function (result) {
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
        });
    });
}

function getUsers(serverId) {
    return dbPromise.then(function (db) {
        return db.get('SELECT current FROM users WHERE id = ? ORDER BY insertionDate DESC LIMIT 1', serverId).then(function (value) {
            if (value !== undefined) {
                return value.current;
            } else {
                return undefined;
            }
        });
    });
}

var code = undefined;
//Routes
router.get('/auth', function (req, res, next) {
    if (req.query.code === undefined) {
        res.redirect(url);
    } else {
        code = req.query.code;
        new Promise(function (resolve, reject) {
            oauth2Client.getToken(code, function (err, tok) {
                if (tok !== null) resolve(tok);
                if (err !== null) reject(err);
            });
        }).then(function (result) {
            oauth2Client.credentials = result;
            _fs2.default.writeFile(__dirname + '/tokens.json', JSON.stringify(result, null, 1), { flag: _fs2.default.O_TRUNC }, function (err) {
                if (err) return console.log('Token writing error: ' + err);
                console.log('Saved the new access token!');
            });
            res.redirect(req.baseUrl);
        }).catch(function (error) {
            return console.log(error);
        });
    }
});

// The default path.
router.get('/', function (req, res, next) {
    dbPromise.then(function (db) {
        db.all('SELECT id FROM servers').then(function (rows) {
            var arr = [];
            rows.forEach(function (row) {
                arr.push(row.id);
            });
            return arr;
        }).then(function (value) {
            res.json(value);
        });
    });
});

router.get('/:id', function (req, res, next) {
    Promise.all([getUptimeThisMonth(req.params.id), getAlerts(req.params.id), getHostName(req.params.id), getUp(req.params.id), getUsers(req.params.id)]).then(function (values) {
        try {
            res.json({
                uptime: values[0],
                alerts: values[1],
                hostname: values[2],
                up: values[3],
                users: values[4]
            });
        } catch (error) {
            res.send('There was no server at this index');
        }
    }).catch(function (reason) {
        return console.log('ERROR: ' + reason);
    });
});

router.get('/:id/graph', function (req, res, next) {
    var traffic = { time: [], in: [], out: [] };
    var server = { time: [], cpu: [], mem: [] };
    dbPromise.then(function (db) {
        Promise.all([db.all('SELECT * FROM traffic WHERE id = ? ORDER BY insertionDate DESC LIMIT 20 ', req.params.id).then(function (rows) {
            rows.forEach(function (row) {
                traffic.out.push(row.outgoing);
                traffic.in.push(row.ingoing);
                traffic.time.push(new Date(row.insertionDate));
            });
        }), db.all('SELECT * FROM cpu WHERE id = ? ORDER BY insertionDate DESC LIMIT 20', req.params.id).then(function (rows) {
            rows.forEach(function (row) {
                server.cpu.push(row.one * 100);
                server.time.push(new Date(row.insertionDate));
            });
        }), db.all('SELECT * FROM memory WHERE id = ? ORDER BY insertionDate DESC LIMIT 20', req.params.id).then(function (rows) {
            rows.forEach(function (row) {
                server.mem.push(row.memory * 100);
            });
        })]).then(function () {
            res.json({
                traffic: traffic,
                server: server
            });
        });
    });
});

module.exports = router;