import express from 'express';
import Slack from './slack';
import path from 'path';
let router = express.Router();
let slackToken = require('../../json/slack.json');

router.get('/', (req, res) => {
    let slackClient = new Slack(slackToken.token);
    slackClient.getStatuses('C03PYF9EE')
    .then((status) => {
        res.json({
            status
        });
    });
});

module.exports = router;