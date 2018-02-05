import google from 'googleapis';
let tokens = require('./google.json');

class Google {
    constructor() {
        //Create instance of oauth2
        this.OAuth2 = google.auth.OAuth2;
        //Create instance of analytics api
        this.analytics = google.analyticsreporting('v4');
        //Create oauth2 client
        this.oauth2Client = new this.OAuth2(
            this.googleOAuth2.installed.client_id,
            this.googleOAuth2.installed.client_secret,
            this.googleOAuth2.installed.redirect_uris[1]
        );
        //Set the clients credentials.
        this.oauth2Client.credentials = tokens;
        //Generate a auth link.
        this.url = this.oauth2Client.generateAuthUrl({
            scope: 'https://www.googleapis.com/auth/analytics.readonly'
        });
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
        return new Promise((resolve, reject) => {
            this.oauth2Client.getToken(code, function (err, tok) {
                if(tok !== null)
                    resolve(tok);
                if(err !== null)
                    reject(err)
            });
        })
        .then((result) => {
            this.oauth2Client.credentials = result;
        }).catch((error) => console.log(error));
    }
}

export default Google;