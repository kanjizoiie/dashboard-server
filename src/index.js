import express from 'express';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';


const app = express();
const SERVER_PORT = 1337;
const router = express.Router();

// create a write stream (in append mode)
let accessLogStream = fs.createWriteStream(path.join(__dirname, '/logs/access.log'), {
    flags: 'a'
});

// setup the logger
app.use(morgan('combined', {
    stream: accessLogStream,
    skip: (req, res) => {
        return res.statusCode < 400
    }
}));

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// setup the routes in the router
router.use('/data', require('./data'));

// tell the app to use the router
app.use('/api', router);

// start the express server.
app.listen(SERVER_PORT, () => {
    console.log("Server started on port: " + SERVER_PORT);
});
