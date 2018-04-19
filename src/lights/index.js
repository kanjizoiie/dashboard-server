import express from 'express';
import Lights from './lights';
let hue = require('../json/hueUser.json');
let lightConfig = require('../json/lightConfig.json');

let router = express.Router();
let l = new Lights(hue.username);
l.findBridge();

router.get('/green', (req, res) => {
    res.send(l.setLight(lightConfig.light, Lights.RSGREEN));
});

router.get('/yellow', (req, res) => {
    res.send(l.setLight(lightConfig.light, Lights.YELLOW));
});

router.get('/red', (req, res) => {
    res.send(l.setLight(lightConfig.light, Lights.RED));
});

module.exports = router;