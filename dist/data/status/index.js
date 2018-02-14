'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _slack = require('./slack');

var _slack2 = _interopRequireDefault(_slack);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();
var slackToken = require(_path2.default.join(__dirname, '../../json/slack.json'));

router.get('/', function (req, res) {
    var slackClient = new _slack2.default(slackToken.token);
    slackClient.getStatus().then(function (result) {
        return result.filter(function (elem) {
            return elem.real_name;
        });
    }).then(function (result) {
        return result.filter(function (elem) {
            return elem.text || elem.emoji;
        });
    }).then(function (result) {
        res.json({
            status: result
        });
    });
});

module.exports = router;