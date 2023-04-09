import * as mqtt from "mqtt"  // import everything inside the mqtt module and give it the namespace "mqtt"
let client = mqtt.connect('mqtt://1.14.96.71') // create a client

client.on('connect', function () {
    client.subscribe('presence', function (err) {
        if (!err) {
            client.publish('presence', 'Hello mqtt')
        }
    })
})

client.on('message', function (topic, message) {
    // message is Buffer
    console.log(topic.toString(), message.toString())
    client.end()
})