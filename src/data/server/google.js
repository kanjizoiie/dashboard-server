import google from 'googleapis';
import path from 'path';

let tokens = require('../../json/google.json');
let googleOAuth2 = require('../../json/googleAccount.json')
class Google {
    static instance = null;
    constructor() {
        if (!this.instance) {
            this.instance = this;
        }

        //Create instance of googles oauth2client
        this.OAuth2 = google.auth.OAuth2;

        //Create instance of analytics api
        this.analytics = google.analyticsreporting('v4');

        //Create oauth2 client
        this.oauth2Client = new this.OAuth2(
            googleOAuth2.installed.client_id,
            googleOAuth2.installed.client_secret,
            googleOAuth2.installed.redirect_uris[1]
        );
        //Set the clients credentials.
        this.oauth2Client.credentials = tokens;
        //Generate a auth link.
        this.url = this.oauth2Client.generateAuthUrl({
            scope: 'https://www.googleapis.com/auth/analytics.readonly'
        });
        return this.instance;
    }
    /**
     * Fetches Google analytics data from the authorized google account.
     * @param {any} reportRequest This follows the reportRequest structure for batchGet requests in google analytics.
     * @returns Promise of with the resolved report.
     */
    batchGet(reportRequest) {
        return new Promise((resolve, reject) => {
            try {
                this.analytics.reports.batchGet({
                    resource: {
                        reportRequests: reportRequest
                    },
                    auth: this.oauth2Client
                }, function (error, response) {
                    if (error !== null) {
                        reject(error);
                    }
                    else {
                        resolve(response);
                    }
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    
    authURL() {
        return this.url;
    }

    auth(code) {
        new Promise((resolve, reject) => {
            this.oauth2Client.getToken(code, function (err, tok) {
                if(tok !== null)
                    resolve(tok);
                if(err !== null)
                    reject(err)
            });
        })
        .then((result) => {
            this.oauth2Client.credentials = result;
            fileSystem.writeFile(__dirname + '../../json/google.json', JSON.stringify(result, null, 1), { flag: fileSystem.O_TRUNC }, (err) => {
                if(err)
                    console.log('Token writing error: ' + err);
                else
                    console.log('Saved the new access token!');
            });
        }).catch((error) => console.log(error));
    }
}

export default Google;