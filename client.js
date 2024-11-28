const dgram = require('dgram');
const client = dgram.createSocket({
    type: 'udp4',
    reuseAddr: true
});
const UDP_PORT = 33333;

// Track messages and their timeouts
const messages = new Set();

// Enable broadcast and bind to the broadcast port
client.bind(UDP_PORT, () => {
    client.setBroadcast(true);
});

function displayMessages() {
    console.clear();
    for (const msg of messages) {
        process.stdout.write(msg + '\n');
    }
}

// Listen for messages
client.on('message', (msg) => {
    const message = msg.toString().trim();
    if (message) {
        messages.add(message);
        displayMessages();
        
        // Remove message after 5 seconds
        setTimeout(() => {
            messages.delete(message);
            displayMessages();
        }, 5000);
    }
});

// Send messages from command line
process.stdin.on('data', (data) => {
    const message = data.toString().trim();
    if (message) {
        client.send(message, UDP_PORT, '255.255.255.255');
    }
});