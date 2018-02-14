'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var options = require(_path2.default.join(__dirname, '../json/options.json'));
var router = _express2.default.Router();
var weather = '';

router.use('/server', require('./server'));
router.use('/news', require('./news'));
router.use('/status', require('./status'));

function fetchData() {
    _axios2.default.get('http://api.openweathermap.org/data/2.5/weather?q=' + options.weather.city + '&APPID=' + options.weather.key + '&units=' + options.weather.units).then(function (response) {
        weather = response.data;
    }).catch(function (reason) {
        weather = [];
    });
    setTimeout(fetchData, 5000);
}
fetchData();

// Define the homeroute
router.get('/', function (req, res) {
    res.json({
        time: (0, _moment2.default)().format('HH:mm:ss'),
        date: (0, _moment2.default)().format('DD-MM-YY'),
        weather: weather
    });
});

router.get('/date', function (req, res, next) {
    res.json({
        value: (0, _moment2.default)().format('DD-MM-YY')
    });
});

router.get('/time', function (req, res, next) {
    res.json({
        value: (0, _moment2.default)().format('HH:mm:ss')
    });
});

router.get('/weather', function (req, res, next) {
    res.json(weather);
});

module.exports = router;