// import * as mqtt from "mqtt"  // import everything inside the mqtt module and give it the namespace "mqtt"
const mqtt = require('mqtt')
let client = mqtt.connect('mqtt://1.14.96.71') // create a client
// console.log(client);
client.on('connect', function () {
    client.publish('presence', 'dsadsa')
    // console.log(client.publish('presence', 'dsadsa'));
})

// client.on('message', function (topic, message) {
//     // message is Buffer
//     console.log(topic.toString(), message.toString())
//     client.end()
// })