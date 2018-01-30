import express from 'express';
import axios from 'axios';
import moment from 'moment';
import { parseString } from 'xml2js';

let router = express.Router();

function convertDateString(dateString) {
    return moment(dateString).format('DD-MM-YYYY, HH:mm ');
}

router.get('/', (req, res) => {
    let articles = []
    axios.get('https://www.svt.se/nyheter/lokalt/vasternorrland/rss.xml').then((response) => {
        parseString(response.data, (err, result) => result.rss.channel[0].item.forEach(
            item => {
                articles.push({
                    title: item.title[0],
                    pubDate: convertDateString(item.pubDate[0]),
                    description: item.description[0],
                    link: item.link[0]
                });
            }));
    }).then(() => res.json({
        news: articles.slice(0, 10)
    }));
});

module.exports = router;