'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var auth = require(_path2.default.join(__dirname, '../../json/nagios.json'));

var Nagios = function () {
    function Nagios(serverHost, name, description) {
        _classCallCheck(this, Nagios);

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


    _createClass(Nagios, [{
        key: 'fetchNagiosData',
        value: function fetchNagiosData(nagiosHostname, description) {
            var _this = this;

            return new Promise(function (resolve, reject) {
                try {
                    return _axios2.default.get(_this.server + '/nagios/cgi-bin/statusjson.cgi?query=service&hostname=' + nagiosHostname + '&servicedescription=' + description, {
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
    }, {
        key: 'getTraffic',
        value: function getTraffic(serverId) {
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
    }, {
        key: 'getCPULoad',
        value: function getCPULoad(serverId) {
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
    }, {
        key: 'getMemory',
        value: function getMemory(serverId) {
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
    }]);

    return Nagios;
}();

exports.default = Nagios;