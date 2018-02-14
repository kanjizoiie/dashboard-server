import express from 'express';
import Slack from './slack';
import path from 'path';
let router = express.Router();
let slackToken = require('../../json/slack.json');

router.get('/', (req, res) => {
    let slackClient = new Slack(slackToken.token);
    slackClient.getStatus().then((result) => {
        return result.filter(elem => { return elem.real_name });
    })
    .then((result) => {
        res.json({
            status: result
        });
    });
});

module.exports = router;