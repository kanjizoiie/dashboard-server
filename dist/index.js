'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();
var SERVER_PORT = 1337;
var router = _express2.default.Router();

// create a write stream (in append mode)
var accessLogStream = _fs2.default.createWriteStream(_path2.default.join(__dirname, '/logs/access.log'), {
    flags: 'a'
});

// setup the logger
app.use((0, _morgan2.default)('combined', {
    stream: accessLogStream,
    skip: function skip(req, res) {
        return res.statusCode < 400;
    }
}));

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// setup the routes in the router
router.use('/data', require('./data'));

// tell the app to use the router
app.use('/api', router);

// start the express server.
app.listen(SERVER_PORT, function () {
    console.log("Server started on port: " + SERVER_PORT);
});