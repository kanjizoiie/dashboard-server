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


    getUserPresence(member) {
        return this.web.users.getPresence(member).then((res) => {
            return res;
        }).catch(console.error);
    }

    getUserInfo(member) {
        return this.web.users.info(member).then((res) => {
            return res;
        }).catch(console.error);
    }

    /**
     * 
     * Get the status of everyone in the channel
     * @param channel the channel where it will look!
     * @memberof Slack
     */
    getStatuses(channel) {
        return this.web.conversations.members(channel).then((res) => {
            let promises = []
            res.members.forEach((member) => {
                promises.push(
                    Promise.all([
                        this.getUserInfo(member),
                        this.getUserPresence(member)
                    ])
                );
            });
            return Promise.all(promises)
                .then((promises) => {
                    return promises.filter((promise) => {
                        return (!promise[0].is_bot || !promise[0].deleted);
                    });
                })
                .then((promises) => {
                    let active = promises.filter((promise) => {
                        return promise[1].presence == 'active';
                    });
                    let away = promises.filter((promise) => {
                        return promise[1].presence == 'away';
                    });
                    return ({
                        active: active,
                        away: away
                    });
                });
        })
            .catch(console.error);
    }
}
export default Slack;
