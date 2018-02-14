import { WebClient } from '@slack/client';
class Slack {
    constructor(token) {
        this.token = token;
        this.web = new WebClient(this.token, { 
            retryConfig: {
                retries: 0
            }, 
            maxRequestConcurrency: Infinity 
        });
    }


    getUserInfo(member) {
        return this.web.users.info(member)
        .then((info) => {
            return this.web.users.getPresence(member)
            .then((presence) => {
                return ({
                    real_name: info.user.real_name,
                    emoji: info.user.profile.status_emoji,
                    text: info.user.profile.status_text,
                    presence: presence.presence
                });
            })
            .catch(console.error);
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
