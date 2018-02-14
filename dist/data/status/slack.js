'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _client = require('@slack/client');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Slack = function () {
    function Slack(token) {
        _classCallCheck(this, Slack);

        this.token = token;
        this.web = new _client.WebClient(this.token);
    }

    _createClass(Slack, [{
        key: 'getUserInfo',
        value: function getUserInfo(member) {
            return this.web.users.info(member).then(function (res) {
                return {
                    real_name: res.user.real_name,
                    emoji: res.user.profile.status_emoji,
                    text: res.user.profile.status_text
                };
            }).catch(console.error);
        }
        /**
         * 
         * Get the status of all the coworkers.
         * @memberof Slack
         */

    }, {
        key: 'getStatus',
        value: function getStatus() {
            var _this = this;

            return this.web.groups.list().then(function (res) {
                var promises = [];
                res.groups[0].members.forEach(function (member) {
                    promises.push(_this.getUserInfo(member));
                });
                return Promise.all(promises);
            }).catch(console.error);
        }
    }]);

    return Slack;
}();

exports.default = Slack;