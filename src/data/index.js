import express from 'express';
import moment from 'moment';
import axios from 'axios';


let options = require('../options.json');
let router = express.Router();
let weather = '';

router.use('/server', require('./server'));
router.use('/news', require('./news'));


function fetchData() {
    axios.get('http://api.openweathermap.org/data/2.5/weather?q=' + options.weather.city + '&APPID=' + options.weather.key + '&units=' + options.weather.units)
    .then((response) => {
        weather = response.data; 
    }).catch((reason) => {
        weather = []
    });
    setTimeout(fetchData, 5000);
}
fetchData();

// Define the homeroute
router.get('/', (req, res) => {
    res.json({
        time: moment().format('HH:mm:ss'),
        date: moment().format('DD-MM-YY'),
        weather: weather
    });
});

router.get('/date', (req, res, next) => {
    res.json({
       value: moment().format('DD-MM-YY'),
    });
});


router.get('/time', (req, res, next) => {
    res.json({
       value: moment().format('HH:mm:ss')       
    });
});

router.get('/weather', (req, res, next) => {
    res.json(weather);
});



module.exports = router