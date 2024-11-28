const dgram = require('dgram');
const express = require('express');
const WebSocket = require('ws');
const app = express();

const WEB_PORT = 3000;
const UDP_PORT = 33333;
const WS_PORT = 33334;

// Create UDP server
const udpServer = dgram.createSocket('udp4');

// Create WebSocket server for web clients
const wsServer = new WebSocket.Server({ port: WS_PORT });

// Keep track of seen message IDs
const seenMessages = new Set();

// Cleanup old messages periodically
setInterval(() => {
    seenMessages.clear();
}, 1000); // Clear every second

// Handle incoming UDP messages
udpServer.on('message', (msg) => {
    const message = msg.toString();
    const [id, text] = message.split('|');
    
    // Skip if we've seen this message
    if (seenMessages.has(id)) return;
    seenMessages.add(id);
    
    // Broadcast via UDP
    udpServer.setBroadcast(true);
    udpServer.send(msg, UDP_PORT, '255.255.255.255');
    
    // Also send to web clients
    wsServer.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(text); // Send only the text part
        }
    });
});

// Handle web client messages
wsServer.on('connection', (ws) => {
    ws.on('message', (msg) => {
        // Add message ID
        const id = Math.random().toString(36).substr(2, 9);
        const message = `${id}|${msg}`;
        
        // Forward web messages to UDP
        udpServer.setBroadcast(true);
        udpServer.send(Buffer.from(message), UDP_PORT, '255.255.255.255');
    });
});

// Serve static files
app.use(express.static('public'));

udpServer.bind(UDP_PORT, () => {
    console.log(`UDP broadcast server running on port ${UDP_PORT}`);
});

app.listen(WEB_PORT, () => {
    console.log(`Web server running on port ${WEB_PORT}`);
    console.log(`WebSocket server running on port ${WS_PORT}`);
});