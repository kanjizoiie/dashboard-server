"use strict";Object.defineProperty(exports,"__esModule",{value:!0});var _createClass=function(){function r(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(e,t,n){return t&&r(e.prototype,t),n&&r(e,n),e}}(),_google=require("./google"),_google2=_interopRequireDefault(_google),_nagios=require("./nagios"),_nagios2=_interopRequireDefault(_nagios),_database=require("./database"),_database2=_interopRequireDefault(_database);function _interopRequireDefault(e){return e&&e.__esModule?e:{default:e}}function _classCallCheck(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}var Data=function(){function e(){_classCallCheck(this,e),this.database=new _database2.default,this.dbPromise=this.database.getDatabase(),this.nagiosFetcher=new _nagios2.default("https://overlord.realsprint.com"),this.googleFetcher=new _google2.default}return _createClass(e,[{key:"getServersArray",value:function(){return this.dbPromise.then(function(e){return e.all("SELECT id FROM servers").then(function(e){var t=[];return e.forEach(function(e){t.push(e.id)}),t})})}},{key:"getRecentAlerts",value:function(){return this.dbPromise.then(function(e){return e.all("SELECT * FROM alerts ORDER BY insertionDate DESC LIMIT 5").then(function(e){var t=[];return e.forEach(function(e){t.push(e)}),t})})}},{key:"getUsers",value:function(t){return this.dbPromise.then(function(e){return e.get("SELECT current FROM users WHERE id = ? ORDER BY insertionDate DESC LIMIT 1",t).then(function(e){return void 0!==e?e.current:void 0})})}},{key:"getUptimeThisMonth",value:function(n){return this.dbPromise.then(function(e){var t=0;return e.all('SELECT * FROM status WHERE id = ? AND insertionDate BETWEEN DATETIME("now", "start of month") AND DATETIME("now", "localtime")',n).then(function(e){return e.forEach(function(e){1!=e.status&&2!=e.status||(t+=1)}),t/e.length})})}},{key:"getAlerts",value:function(t){return this.dbPromise.then(function(e){return e.all("SELECT alerts.id, alerts.insertionDate, alertTypes.code, alertTypes.severity, alertTypes.message FROM alerts INNER JOIN alertTypes ON alertTypes.code = alerts.code AND alerts.id = ?",t).then(function(e){return e})})}},{key:"getHostName",value:function(t){return this.dbPromise.then(function(e){return e.get("SELECT * FROM servers WHERE (id = ?)",t).then(function(e){return e.hostname}).catch(function(e){return console.log(e)})})}},{key:"getUp",value:function(t){return this.dbPromise.then(function(e){return e.all("SELECT * FROM pings WHERE (id = ?) ORDER BY insertionDate DESC LIMIT 3",t).then(function(n){return new Promise(function(e,t){e(n.find(function(e){return e.up}))}).then(function(e){return void 0!==e?n[0].up?2:1:0})})})}},{key:"getGraphs",value:function(t){var n={time:[],in:[],out:[]},r={time:[],cpu:[],mem:[]};return this.dbPromise.then(function(e){return Promise.all([e.all("SELECT * FROM traffic WHERE id = ? ORDER BY insertionDate DESC LIMIT 10",t).then(function(e){e.forEach(function(e){n.out.push(e.outgoing),n.in.push(e.ingoing),n.time.push(new Date(e.insertionDate))})}),e.all("SELECT * FROM cpu WHERE id = ? ORDER BY insertionDate DESC LIMIT 10",t).then(function(e){e.forEach(function(e){r.cpu.push(100*e.one),r.time.push(new Date(e.insertionDate))})}),e.all("SELECT * FROM memory WHERE id = ? ORDER BY insertionDate DESC LIMIT 10",t).then(function(e){e.forEach(function(e){r.mem.push(100*e.memory)})})]).then(function(){return{traffic:n,server:r}})})}}]),e}();exports.default=Data;