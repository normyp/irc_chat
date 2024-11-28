const dgram = require('dgram');
const client = dgram.createSocket({
    type: 'udp4',
    reuseAddr: true
});
const UDP_PORT = 33333;

// Track messages and their timeouts
const messageTimeouts = new Map();

// Enable broadcast and bind to the broadcast port
client.bind(UDP_PORT, () => {
    client.setBroadcast(true);
    console.log('Client ready to receive broadcasts');
});

// Clear console and redraw messages
function updateDisplay() {
    console.clear();
    console.log('Active Messages:');
    console.log('-----------------');
    for (const [msg] of messageTimeouts) {
        console.log(msg);
    }
    console.log('-----------------');
    console.log('Type a message and press Enter to send.');
}

// Listen for messages
client.on('message', (msg, rinfo) => {
    const message = msg.toString().trim();
    
    // Only process new messages
    if (message && !messageTimeouts.has(message)) {
        // Add message with timeout
        messageTimeouts.set(message, setTimeout(() => {
            messageTimeouts.delete(message);
            updateDisplay();
        }, 10000)); // 10 seconds
        
        updateDisplay();
    }
});

// Send messages from command line
process.stdin.on('data', (data) => {
    const message = data.toString().trim();
    if (message) {
        client.send(message, UDP_PORT, '255.255.255.255');
    }
});

console.log('UDP Client started. Type a message and press Enter to send.');