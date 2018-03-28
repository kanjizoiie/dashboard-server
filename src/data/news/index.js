import express from 'express';
import axios from 'axios';
import moment from 'moment';
import { parseString } from 'xml2js';
import apicache from 'apicache';
let cache = apicache.middleware;
let router = express.Router();

function convertDateString(dateString) {
    return moment(dateString).format('ddd, HH:mm ');
}



router.get('/', cache('6 minutes'), (req, res) => {
    axios.get('https://www.svt.se/nyheter/lokalt/vasternorrland/rss.xml').then((response) => {
        let articles = [];
        parseString(response.data, (err, result) => {
            result.rss.channel[0].item.forEach(
                item => {
                    articles.push({
                        title: item.title[0],
                        pubDate: convertDateString(item.pubDate[0]),
                        description: item.description[0]
                    });
                }
            );
        });
        return articles;
    }).then((artices) => res.json({
        news: artices.slice(0, 8)
    }));
});

router.get('/channel', cache('30 minutes'), (req, res) => {
    axios.get('https://www.svt.se/nyheter/lokalt/vasternorrland/rss.xml').then((response) => {
        let title = '';
        parseString(response.data, (err, result) => {
            title = result.rss.channel[0].title[0];
        });
        return title;
    }).then((title) => res.json({
        title
    }));
});

module.exports = router;