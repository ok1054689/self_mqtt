// import * as mqtt from "mqtt"  // import everything inside the mqtt module and give it the namespace "mqtt"
const mqtt = require('mqtt')
const Gpio = require('onoff').Gpio;
require('dotenv').config();
// const http = require('http');

const config = {
    controlDeviceId: process.env.CONTROL_DEVICE_ID,
    brokerUrl: process.env.BROKER_URL,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    beattim: process.env.BEATTIM ?? 1,
}

const devices = {
    power_1: {
        pin: 198,
        type: "relay",
    }
}

const handlers = {
    relay: {
        set: (pin, on) => {
            on = on == "on" ? 1 : 0
            const gpio = new Gpio(pin, 'out');
            gpio.writeSync(on); // 将新值写入 GPIO
            //返回结果
            return gpio.readSync()
        },
        get: (pin) => {
            const gpio = new Gpio(pin);
            //返回结果
            return gpio.readSync()
        }
    }
}





let client = mqtt.connect(config.brokerUrl, {
    username: config.username,
    password: config.password,
}) // create a client


client.on('connect', function () {
    const topic = config.controlDeviceId + "/+/set"
    client.subscribe(topic, { qos: 2 }, function (err) {
        if (!err) {
            console.log('init connect mqtt', `subscribe topic: ${topic}`)
        }
    })

})

client.on("message", function (topic, message) {

    /**
     * {
     *      key:power_1,
     *      action:"off"
     * }
     */
    try {
        const msgObj = JSON.parse(message)
        // console.log('msgObj', msgObj);
        /**
         * 到期时间
         */
        if (msgObj.key) {
            const device = devices[msgObj.key]
            if (device.type == "relay" && device.pin) {
                const topic = `${config.controlDeviceId}/${msgObj.key}/state`
                console.log("device", msgObj.on, device);
                client.publish(
                    topic,
                    JSON.stringify({
                        device,
                        state: handlers.relay.set(device.pin, msgObj.on),
                        topic
                    })
                )
            }
        }

    } catch (e) {
        console.log(topic, e);
        // return false;
    }
    // client.end()
})



setInterval(async () => {

    const keys = Object.keys(devices);
    keys.map((key) => {
        try {
            const device = devices[key]

            if (device.type == "relay" && device.pin) {
                const topic = `${config.controlDeviceId}/${key}/state`
                client.publish(
                    topic,
                    JSON.stringify({
                        device,
                        state: handlers.relay.get(device.pin),
                        topic
                    })
                )
            }
            // console.log("publish", type, pin, mqttTopic, result);

        } catch (error) {
            console.error("client.publish", error, device);
        }
    })


}, config.beattim * 1000);


