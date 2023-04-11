// import * as mqtt from "mqtt"  // import everything inside the mqtt module and give it the namespace "mqtt"
const mqtt = require('mqtt')
const Gpio = require('onoff').Gpio;

const config = {
    brokerUrl: 'mqtt://1.14.96.71',
    topic: "device/nanchong_wanda_1",
    username: 'test',
    password: 'test',
}

let client = mqtt.connect(config.brokerUrl, {
    username: config.username,
    password: config.password,
}) // create a client



// console.log(client);
client.on('connect', function () {
    client.subscribe(config.topic, function (err) {
        if (!err) {
            console.log('init connect mqtt')
        }
    })

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
        if (msgObj.type == "gpio" && msgObj.pin && msgObj.action) {
            const pin = new Gpio(msgObj.pin, 'out');
            const value = msgObj.action == "off" ? 0 : 1; // 切换 GPIO 值（异或运算）
            pin.writeSync(value); // 将新值写入 GPIO
            //后续处理
            result = pin.readSync()
            console.log({ ...msgObj, result })
            client.publish(config.topic + "/state", JSON.stringify({ result, pin: msgObj.pin }))
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
        console.log("doSomething正在循环");
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// doSomething();
