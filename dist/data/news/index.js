'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _xml2js = require('xml2js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

function convertDateString(dateString) {
    return (0, _moment2.default)(dateString).format('DD-MM-YYYY, HH:mm ');
}

router.get('/', function (req, res) {
    var articles = [];
    _axios2.default.get('https://www.svt.se/nyheter/lokalt/vasternorrland/rss.xml').then(function (response) {
        (0, _xml2js.parseString)(response.data, function (err, result) {
            return result.rss.channel[0].item.forEach(function (item) {
                articles.push({
                    title: item.title[0],
                    pubDate: convertDateString(item.pubDate[0]),
                    description: item.description[0],
                    link: item.link[0]
                });
            });
        });
    }).then(function () {
        return res.json({
            news: articles.slice(0, 10)
        });
    });
});

module.exports = router;