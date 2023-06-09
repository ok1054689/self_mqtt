// import * as mqtt from "mqtt"  // import everything inside the mqtt module and give it the namespace "mqtt"
const mqtt = require('mqtt')
let client = mqtt.connect('mqtt://1.14.96.71',{
    username: 'test',
    password: 'test',
}) // create a client
// console.log(client);
client.on('connect', function () {
    // client.end()
    console.log("连接上了");
    // console.log(client.publish('presence', 'dsadsa'));
})

//从api 那边获取配置
const room = {
    id: 1,
    name: "1号房间",
    expire: "2023-04-12T10:05:42.093Z",
    power: false,
    mqttConfigs: [{
        topic: "self_room_command",
        GPIO: "02",
        type: "relay"
    }]
}


room.mqttConfigs.map((config) => {

    const message = {
        id: room.id,
        name: room.name,
        expire: room.expire,
        power: false,
        config
    }
    client.publish(config.topic, JSON.stringify(message))
})






client.on('message', function (topic, message) {
    // message is Buffer
    console.log(message.toString())
    // client.end()
})

client.on('close', function () {
    console.log('disconnected');
});


client.on('offline', function () {
    console.log('offline');
});

client.on('reconnect', function () {
    console.log('reconnecting');
});

