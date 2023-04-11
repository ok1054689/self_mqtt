// import * as mqtt from "mqtt"  // import everything inside the mqtt module and give it the namespace "mqtt"
const mqtt = require('mqtt')
const Gpio = require('onoff').Gpio;
// const http = require('http');
const qs = require('qs');
require('dotenv').config();
const axios = require('axios');

const config = {
    controlDeviceId: process.env.CONTROL_DEVICE_ID,
    brokerUrl: process.env.BROKER_URL,
    // topic: "device/nanchong_wanda_1",
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    beattim: 5,
}
function getStrapiURL(path) {
    return `${process.env.STRAPI_API_URL || "http://localhost:1337"
        }${path}`
}
async function fetchAPI(path, urlParamsObject = {}, options = {}) {
    // Merge default and user options
    const mergedOptions = {
        headers: {
            "Content-Type": "application/json",
        },
        ...options,
    }

    // Build request URL
    const queryString = qs.stringify(urlParamsObject)
    const requestUrl = `${getStrapiURL(
        `/api${path}${queryString ? `?${queryString}` : ""}`
    )}`

    // Trigger API call
    const response = await axios.get(requestUrl, mergedOptions)

    // Handle response
    if (response.status !== 200) {
        console.error(response.statusText, response.status)
        throw new Error(`An error occured please try again`)
    }
    // console.log("response.data",response.data)
    // const data = await JSON.parse(response.data)
    return response.data
}

const getDevices = (async () => {
    try {
        const devices = await fetchAPI('/devices', {
            filters: {
                controlDeviceId: config.controlDeviceId,
            },
        })
        // console.log("devices", devices);
        return devices
        // 在这里使用devices变量做其他操作
        // ...

    } catch (error) {

        console.error(error);
        return false
    }
})





let client = mqtt.connect(config.brokerUrl, {
    username: config.username,
    password: config.password,
}) // create a client

// console.log(config, "config");

// console.log(client);
client.on('connect', async function () {

    const devices = await getDevices()
    // console.log("devices",devices);
    if (devices) {
        devices.data.map((device) => {
            try {
                client.subscribe(device.attributes.mqttTopic, { qos: 2 }, function (err) {
                    if (!err) {
                        console.log('init connect mqtt', device.attributes.mqttTopic)
                    }
                })
            } catch (error) {
                console.error("client.subscribe", error, device);
            }
        })
    } else {
        console.error("not devices");
    }


    //请求api这个店里所有的房间。

})

client.on("message", function (topic, message) {
    /**
     * {
     *      pin:198,
     *      type: "gpio",
     *      action:"off"
     * }
     */
    try {
        const msgObj = JSON.parse(message)
        let result = null

        /**
         * 到期时间
         */
        // if (msgObj) {
        //     const expireDate = new Date(msgObj.expire)
        //     if (expireDate < new Date()) {
        //         // 关电
        //         // client.publish(config.topic, '关电成功')
        //         console.log("已到期，关电成功");
        //     } else {
        //         // client.publish(config.topic, '未到期')
        //         console.log("未到期");
        //     }
        // }
        if (msgObj.type == "relay" && msgObj.pin && msgObj.action) {
            const pin = new Gpio(msgObj.pin, 'out');
            const value = msgObj.action == "off" ? 0 : 1; // 切换 GPIO 值（异或运算）
            pin.writeSync(value); // 将新值写入 GPIO
            //后续处理
            result = pin.readSync()
            console.log({ ...msgObj, result })
            client.publish(config.topic + "/state", JSON.stringify({ result, pin: msgObj.pin }), { qos: 2 })
        }

    } catch (e) {
        console.log(topic, e);
        // return false;
    }

    // message is Buffer

    // client.end()
})

async function doSomething() {
    while (true) {
        const devices = await getDevices()
        // console.log("doSomething正在循环");
        if (devices) {
            devices.data.map((device) => {
                try {

                    if (device.attributes.type == "relay" && device.attributes.pin) {
                        const pin = new Gpio(device.attributes.pin, 'out');
                        result = pin.readSync()
                        client.publish(device.attributes.mqttTopic + "/state", JSON.stringify({ result, pin }))
                    }
                } catch (error) {
                    console.error("client.publish", error, device);
                }
            })
        }
        //等待
        await new Promise(resolve => setTimeout(resolve, config.beattim));
    }
}

doSomething();
