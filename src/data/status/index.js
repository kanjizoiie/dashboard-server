import express from 'express';
import Slack from './slack';
import path from 'path';
import apicache from 'apicache';
let cache = apicache.middleware;
let router = express.Router();


let slackToken = require(path.resolve('src/json/slack.json'));
let slackClient = new Slack(slackToken.token);

router.get('/', cache('6 minutes'), (req, res) => {
    slackClient.getStatuses('C03PYF9EE')
        .then((status) => {
            res.json({
                status
            });
        });
});

module.exports = router;