'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DataFetcher = function () {
    function DataFetcher(path) {
        _classCallCheck(this, DataFetcher);

        this.dbpromise = sqlite.open(path, { Promise: Promise });
        this.pings();
        this.nagios();
        this.googleGet();
    }

    _createClass(DataFetcher, [{
        key: 'pings',
        value: function (_pings) {
            function pings() {
                return _pings.apply(this, arguments);
            }

            pings.toString = function () {
                return _pings.toString();
            };

            return pings;
        }(function () {
            var _this = this;

            this.dbpromise.then(function (db) {
                db.all('SELECT * FROM SERVERS WHERE hostname IS NOT null').then(function (rows) {
                    rows.forEach(function (row) {
                        ping.sys.probe(row.hostname, function (currentlyUp, error) {
                            _this.dbpromise.then(function (db) {
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
            setTimeout(pings, 5000);
        })
    }, {
        key: 'nagios',
        value: function nagios() {
            var _this2 = this;

            this.dbpromise.then(function (db) {
                db.all('SELECT * FROM SERVERS WHERE (nagios IS NOT null)').then(function (rows) {
                    rows.forEach(function (row) {
                        Promise.all([getTraffic(row.id), getCPULoad(row.id), getMemory(row.id)]).then(function (values) {
                            try {
                                _this2.dbpromise.then(function (db) {
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
    }, {
        key: 'google',
        value: function (_google) {
            function google() {
                return _google.apply(this, arguments);
            }

            google.toString = function () {
                return _google.toString();
            };

            return google;
        }(function () {
            var _this3 = this;

            this.dbpromise.then(function (db) {
                db.all('SELECT * FROM SERVERS WHERE (viewId IS NOT null)').then(function (rows) {
                    rows.forEach(function (row) {
                        getUsers(row.id).then(function (values) {
                            try {
                                _this3.dbpromise.then(function (db) {
                                    db.run('INSERT INTO users (id, current, insertionDate) VALUES (?, ?, DATETIME("now"))', row.id, values);
                                });
                            } catch (error) {
                                console.log(error);
                            }
                        });
                    });
                });
            });
            setTimeout(google, 15000);
        })
    }]);

    return DataFetcher;
}();

exports.default = DataFetcher;