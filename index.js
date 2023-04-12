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
    discovery_prefix: "homeassistant"
}
// homeassistant 发现设备格式 https://www.home-assistant.io/integrations/mqtt/#discovery-examples
// <discovery_prefix>/<component>/[<node_id>/]<object_id>/config 
//<discovery_prefix>/<component>/<id>/config 



const devices = {
    "power_1": {
        name: "卧室灯电源",
        pin: 198,
        type: "relay",
        component: "switch",
        mqtt: {
            "~": `${config.discovery_prefix}/switch/${config.controlDeviceId}/power_1`,
            unique_id: config.controlDeviceId + "_" + "power_1",
            cmd_t: "~/set",
            stat_t: "~/state",
            schema: "json",
            payload_on: '{"key": "power_1","on": "on"}',
            payload_off: '{"key": "power_1"}',
            state_on: "ON",
            state_off: "OFF",
        }

        // HASS_object_id: process.env.CONTROL_DEVICE_ID + "power_1"
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
    const topic = `${config.discovery_prefix}/+/${config.controlDeviceId}/+/set`
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
                const topic = `${device.mqtt["~"]}/state`
                console.log("device", msgObj.on, device);
                client.publish(
                    topic,
                    JSON.stringify({
                        // device,
                        topic,
                        state: handlers.relay.set(device.pin, msgObj.on) ? "ON" : "OFF",

                    })
                )
            }
        }

    } catch (e) {
        console.log(topic, e);
        client.publish(
            "debug",
            JSON.stringify({
                // device,
                topic,
                e

            })
        )
        // return false;
    }
    // client.end()
})


/**
 * 状态
 */
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
                        state: handlers.relay.get(device.pin) ? "ON" : "OFF",
                        topic
                    })
                )
            }
            // console.log("publish", type, pin, mqttTopic, result);

        } catch (error) {
            console.error("client.publish", error);
        }
    })


}, config.beattim * 1000);


/**
 * homeassistant 发现设备格式
 */
setInterval(async () => {
    console.log("mqtt config");
    const keys = Object.keys(devices);
    keys.map((key) => {
        try {
            const device = devices[key]

            if (device) {
                // const topic = `${config.controlDeviceId}/${key}/state`

                const topic = `${device.mqtt["~"]}`
                // const device
                if (device.type == "relay" && device.pin) {
                    client.publish(
                        topic + "/config",
                        JSON.stringify(device.mqtt)
                    )
                }
            }
            // console.log("publish", type, pin, mqttTopic, result);

        } catch (error) {
            console.error("client.publish", error, device);
        }
    })


}, 10000);


