"use strict";Object.defineProperty(exports,"__esModule",{value:!0});var _createClass=function(){function r(e,t){for(var a=0;a<t.length;a++){var r=t[a];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(e,t,a){return t&&r(e.prototype,t),a&&r(e,a),e}}(),_sqlite=require("sqlite"),_sqlite2=_interopRequireDefault(_sqlite);function _interopRequireDefault(e){return e&&e.__esModule?e:{default:e}}function _classCallCheck(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}var Database=function(){function e(){return _classCallCheck(this,e),this.instance||(this.instance=this),this.dbPromise=_sqlite2.default.open("./src/database/database.sqlite",{Promise:Promise}),this.instance}return _createClass(e,[{key:"getDatabase",value:function(){return this.dbPromise}}]),e}();exports.default=Database;