import express from 'express';
import Google from './google';
import dataGetter from './dataGetter';
import fileSystem from 'fs';

//Create a new router.
let router = express.Router();

let data = new dataGetter();
let google = new Google();
let code = undefined;
//Routes
router.get('/auth', (req, res, next) => {
    if (req.query.code === undefined) {
        res.redirect(google.url);
    }
    else {
        code = req.query.code;
        google.auth(code)
        .then((result) => {
            oauth2Client.credentials = result;
            res.redirect(req.baseUrl);
        }).catch((error) => console.log(error));
    }
});

// The default path.
router.get('/', (req, res, next) => {
    Promise.all([
        data.getServersArray()
    ])
    .then((result) => {
        console.log(result)
        res.json(result);
    })
})

router.get('/:id', (req, res, next) => {
    Promise.all([
        data.getUptimeThisMonth(req.params.id),
        data.getAlerts(req.params.id),
        data.getHostName(req.params.id),
        data.getUp(req.params.id),
        data.getUsers(req.params.id)
    ]).then((values) => {
        try {
            res.json({
                uptime: values[0],
                alerts: values[1],
                hostname: values[2],
                up: values[3],
                users: values[4]
            });
        }
        catch (error) {
            res.send('There was no server at this index');
        }
    });
});

router.get('/:id/graph', (req, res, next) => {
    data.getGraphs(req.params.id)
    .then((result) => {
        res.json(result);
    });
});

module.exports = router;