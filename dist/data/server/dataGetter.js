'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DataGetter = function () {
    function DataGetter() {
        _classCallCheck(this, DataGetter);

        this.dbpromise = sqlite.open(path, { Promise: Promise });
    }

    _createClass(DataGetter, [{
        key: 'getServersArray',
        value: function getServersArray() {
            this.dbPromise.then(function (db) {
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
        }
    }, {
        key: 'getUsers',
        value: function getUsers(serverId) {
            dbPromise.then(function (db) {
                return db.get('SELECT current FROM users WHERE id = ? ORDER BY insertionDate DESC LIMIT 1', server).then(function (value) {
                    if (value !== undefined) {
                        return value.current;
                    } else {
                        return undefined;
                    }
                });
            });
        }
    }, {
        key: 'getGraphs',
        value: function getGraphs(serverId) {
            var traffic = { time: [], in: [], out: [] };
            var server = { time: [], cpu: [], mem: [] };
            return dbPromise.then(function (db) {
                Promise.all([db.all('SELECT * FROM traffic WHERE id = ? ORDER BY insertionDate DESC LIMIT 20 ', server).then(function (rows) {
                    rows.forEach(function (row) {
                        traffic.out.push(row.outgoing);
                        traffic.in.push(row.ingoing);
                        traffic.time.push(new Date(row.insertionDate));
                    });
                }), db.all('SELECT * FROM cpu WHERE id = ? ORDER BY insertionDate DESC LIMIT 20', server).then(function (rows) {
                    rows.forEach(function (row) {
                        server.cpu.push(row.one * 100);
                        server.time.push(new Date(row.insertionDate));
                    });
                }), db.all('SELECT * FROM memory WHERE id = ? ORDER BY insertionDate DESC LIMIT 20', server).then(function (rows) {
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
        }
    }]);

    return DataGetter;
}();