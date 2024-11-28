const dgram = require('dgram');
const client = dgram.createSocket({
    type: 'udp4',
    reuseAddr: true
});
const UDP_PORT = 33333;

// Enable broadcast and bind to the broadcast port
client.bind(UDP_PORT, () => {
    client.setBroadcast(true);
});

// Listen for messages
client.on('message', (msg) => {
    const message = msg.toString().trim();
    if (message) {
        console.log(message);
    }
});

// Send messages from command line
process.stdin.on('data', (data) => {
    const message = data.toString().trim();
    if (message) {
        client.send(message, UDP_PORT, '255.255.255.255');
    }
});