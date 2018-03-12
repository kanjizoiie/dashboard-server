import axios from 'axios';
class Lights {
    constructor(username) {
        this.username = username;
        this.bridgeFound = true;
    }
    static RSGREEN = {
        xy: [0.3999, 0.5214],
        sat: 255,
        bri: 224
    }

    static GREEN = {
        hue: 25500,
        sat: 255,
        bri: 254
    }

    static RED = {
        hue: 0,
        sat: 255,
        bri: 254
    }

    static BLUE = {
        hue: 46920,
        sat: 255,
        bri: 254
    }
    
    static YELLOW = {
        hue: 12750,
        sat: 255,
        bri: 254
    }
    findBridge() {
        const classthis = this;
        axios.get('https://www.meethue.com/api/nupnp').then((response) => {
            try {
                classthis.bridgeIP = response.data[0].internalipaddress;
                console.log(this.bridgeIP);
            }
            catch (except) {
                classthis.bridgeFound = false;
                throw 'Could not find bridge'
            }
        }).catch((reason) => {
            console.log(reason.code);
        });

    }

    //Blinks the light using using the /api/lights/blink/:light:/:interval:/
    blinkLight(light, interval) {
        if(this.bridgeFound) {
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
        else {
            throw 'Bridge not found';
        }
    }

    /**
     * 
     * 
     * @param {any} light 
     * @param {any} putObject 
     * @memberof Lights
     */
    setLight(light, putObject) {
        let ret = false
        if(this.bridgeFound) {
            axios.put('http://' + this.bridgeIP + '/api/' + this.username + '/lights/' + light + '/state', putObject)
            .then((resp) => {
                console.log(resp);
                ret = true;
            })
            .catch((reason) => {
                console.log(reason);
            });
        }
        else {
            throw 'Bridge not found';
        }
    }
}

export default Lights;