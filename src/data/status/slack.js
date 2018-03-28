import { WebClient } from '@slack/client';
class Slack {
    constructor(token) {
        this.token = token;
        this.web = new WebClient(this.token, {
            maxRequestConcurrency: Infinity 
        });
    }


    getUserPresence(member) {
        return this.web.users.getPresence({ user: member })
            .then((res) => {
                return res;
            }).catch(console.error);
    }

    getUserInfo(member) {
        return this.web.users.info({ user: member})
            .then((res) => {
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
        return this.web.conversations.members({channel: channel}).then((res) => {
            let promises = [];
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
                    //Filter bots and deleted people.
                    return promises.filter((res) => {
                        return !(res[0].user.is_bot || res[0].user.deleted);
                    });
                })
                .then((promises) => {
                    //Sort based on their presence
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
