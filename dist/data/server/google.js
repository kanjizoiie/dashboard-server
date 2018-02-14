'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _googleapis = require('googleapis');

var _googleapis2 = _interopRequireDefault(_googleapis);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var tokens = require(_path2.default.join(__dirname, '../../json/google.json'));

var Google = function () {
    function Google() {
        _classCallCheck(this, Google);

        //Create instance of oauth2
        this.OAuth2 = _googleapis2.default.auth.OAuth2;
        //Create instance of analytics api
        this.analytics = _googleapis2.default.analyticsreporting('v4');
        //Create oauth2 client
        this.oauth2Client = new this.OAuth2(this.googleOAuth2.installed.client_id, this.googleOAuth2.installed.client_secret, this.googleOAuth2.installed.redirect_uris[1]);
        //Set the clients credentials.
        this.oauth2Client.credentials = tokens;
        //Generate a auth link.
        this.url = this.oauth2Client.generateAuthUrl({
            scope: 'https://www.googleapis.com/auth/analytics.readonly'
        });
    }
    /**
     * Fetches Google analytics data from the authorized google account.
     * @param {any} reportRequest This follows the reportRequest structure for batchGet requests in google analytics.
     * @returns Promise of with the resolved report.
     */


    _createClass(Google, [{
        key: 'batchGet',
        value: function batchGet(reportRequest) {
            var _this = this;

            return new Promise(function (resolve, reject) {
                try {
                    _this.analytics.reports.batchGet({
                        resource: {
                            reportRequests: reportRequest
                        },
                        auth: _this.oauth2Client
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
    }, {
        key: 'authURL',
        value: function authURL() {
            return this.url;
        }
    }, {
        key: 'auth',
        value: function auth(code) {
            var _this2 = this;

            return new Promise(function (resolve, reject) {
                _this2.oauth2Client.getToken(code, function (err, tok) {
                    if (tok !== null) resolve(tok);
                    if (err !== null) reject(err);
                });
            }).then(function (result) {
                _this2.oauth2Client.credentials = result;
            }).catch(function (error) {
                return console.log(error);
            });
        }
    }]);

    return Google;
}();

exports.default = Google;