import express from 'express';
import Slack from './slack';

let router = express.Router();
let slackToken = require('./slack.json');

router.get('/', (req, res) => {
    let slackClient = new Slack(slackToken.token);
    slackClient.getStatus().then((result) => {
        return result.filter(elem => elem);
    }).then((result) => {
        res.json({
            status: result
        });
    });
});

module.exports = router;