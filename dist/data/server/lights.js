'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Lights = function () {
    function Lights(username, bridgeIP) {
        _classCallCheck(this, Lights);

        this.username = username;
        this.bridgeIP = bridgeIP;
        this.findLights();
    }

    _createClass(Lights, [{
        key: 'findLights',


        /**
         * 
         * Find the all of the lights on the bridge.
         * @memberof Lights
         */
        value: function findLights() {
            var _this = this;

            _axios2.default.get(this.bridgeIP + '/api/' + this.username + '/lights').then(function (response) {
                _this.lights = response.data;
            }).catch(function (reason) {
                console.log(reason.code);
            });
            return this.lights;
        }
    }, {
        key: 'findBridge',
        value: function findBridge() {
            var _this2 = this;

            _axios2.default.get('https://www.meethue.com/api/nupnp').then(function (response) {
                console.log(response.data);
                _this2.bridgeIP = response.data;
            }).catch(function (reason) {
                console.log(reason.code);
            });
            return this.lights;
        }

        //Blinks the light using using the /api/lights/blink/:light:/:interval:/

    }, {
        key: 'blinkLight',
        value: function blinkLight(light, interval) {
            var _this3 = this;

            var ret = false;
            _axios2.default.put(this.bridgeIP + '/api/' + this.username + '/lights/' + light + '/state', {
                'on': true,
                'bri': 254
            }).catch(function (reason) {
                console.log(reason.code);
                ret = false;
            }).then(setTimeout(function () {
                _axios2.default.put(_this3.bridgeIP + '/api/' + _this3.username + '/lights/' + light + '/state', {
                    'on': false
                }).catch(function (reason) {
                    console.log(reason.code);
                    ret = false;
                }).then(function () {
                    ret = true;
                });
            }, interval));
            return ret;
        }

        /**
         * 
         * 
         * @param {any} light 
         * @param {any} putObject 
         * @memberof Lights
         */

    }, {
        key: 'setLight',
        value: function setLight(light, putObject) {
            _axios2.default.put(this.bridgeIP + '/api/' + this.username + '/lights/' + light + '/state', {
                putObject: putObject
            }).catch(function (reason) {
                return reason;
            }).then(function () {
                ret = true;
            });
        }
    }]);

    return Lights;
}();

Lights.GREEN = {
    hue: 25500,
    sat: 25,
    bright: 254
};
Lights.RED = {
    hue: 0,
    sat: 25,
    bright: 254
};
Lights.BLUE = {
    hue: 46920,
    sat: 25,
    bright: 254
};
Lights.BLUE = {
    hue: 46920,
    sat: 25,
    bright: 254
};
Lights.BLUE = {
    hue: 12750,
    sat: 25,
    bright: 254 };
exports.default = Lights;