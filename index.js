// import * as mqtt from "mqtt"  // import everything inside the mqtt module and give it the namespace "mqtt"
const mqtt = require('mqtt')
let client = mqtt.connect('mqtt://1.14.96.71') // create a client
const config = {
    topic: "self_room_command",
    type: "relay"
}


// console.log(client);
client.on('connect', function () {
    client.subscribe(config.topic, function (err) {
        if (!err) {
            client.publish(config.topic, 'init connect mqtt')
        }
    })
})

client.on("message", function (topic, message) {
    // message is Buffer
    console.log( message.toString())
    // client.end()
})