import { WebClient } from '@slack/client';

class Slack {
    constructor(token) {
        this.token = token;
        this.web = new WebClient(this.token);
    }


    getUserInfo(member) {
        return this.web.users.info(member).then((res) => {
            if (res.user.real_name) {
                return ({
                    real_name: res.user.real_name,
                    emoji: res.user.profile.status_emoji,
                    text: res.user.profile.status_text
                });
            }
        })
        .catch(console.error);
    }
    /**
     * 
     * Get the status of all the coworkers.
     * @memberof Slack
     */
    getStatus() {
        return this.web.groups.list().then((res) => {
            let promises = []
            res.groups[0].members.forEach((member) => { 
                promises.push(this.getUserInfo(member));
            });
            return Promise.all(promises);
        })
        .catch(console.error);
    }
}
export default Slack;
