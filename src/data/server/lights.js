import axios from 'axios';
class Lights {
    constructor(username, bridgeIP) {
        this.username = username;
        this.bridgeIP = bridgeIP;
        this.findLights();
    }

    static GREEN = {
        hue: 25500,
        sat: 25,
        bright: 254
    }

    static RED = {
        hue: 0,
        sat: 25,
        bright: 254
    }

    static BLUE = {
        hue: 46920,
        sat: 25,
        bright: 254
    }
    static BLUE = {
        hue: 46920,
        sat: 25,
        bright: 254
    }

    static BLUE = {
        hue: 12750,
        sat: 25,
        bright: 254
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

    findBridge() {
        axios.get('https://www.meethue.com/api/nupnp').then((response) => {
            console.log(response.data)
            this.bridgeIP = response.data;
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

    /**
     * 
     * 
     * @param {any} light 
     * @param {any} putObject 
     * @memberof Lights
     */
    setLight(light, putObject) {
        axios.put(this.bridgeIP + '/api/' + this.username + '/lights/' + light + '/state', {
            putObject
        }).catch((reason) => {
            return reason;
        }).then(() => {
            ret = true;
        });
    }
}

export default Lights;