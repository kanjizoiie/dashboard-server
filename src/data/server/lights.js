import axios from 'axios';


class Lights {
    constructor(username, bridgeIP) {
        this.username = username;
        this.bridgeIP = bridgeIP;
        this.findLights();
    }

    /**
     * 
     * Find the all of the lights on the bridge.
     * @memberof Lights
     */
    findLights() {
        axios.get(this.bridgeIP + '/api/' + this.username + '/lights').then((response) => {
            this.lights = response.data;
        }).catch((reason) => {
            console.log(reason.code);
        });
        return this.lights;
    }

    //Blinks the light using using the /api/lights/blink/:light:/:interval:/
    blinkLight(light, interval) {
        let ret = false;
        axios.put(this.bridgeIP + '/api/' + this.username + '/lights/' + light + '/state', {
                'on': true,
                'bri': 254
            })
            .catch((reason) => {
                console.log(reason.code);
                ret = false;
            })
            .then(setTimeout(() => {
                axios.put(this.bridgeIP + '/api/' + this.username + '/lights/' + light + '/state', {
                    'on': false
                }).catch((reason) => {
                    console.log(reason.code);
                    ret = false;
                }).then(() => {
                    ret = true;
                });
            }, interval));
        return ret;
    }
    alertLights() {

    }
}

export default Lights;