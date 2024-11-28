const dgram = require('dgram');
const express = require('express');
const WebSocket = require('ws');
const app = express();

// Use Render's PORT env var or fallback to local dev ports
const PORT = process.env.PORT || 3000;
const UDP_PORT = 33333;

// Create UDP server
const udpServer = dgram.createSocket('udp4');

// Create WebSocket server attached to HTTP server
const server = app.listen(PORT, () => {
    console.log(`Web server running on port ${PORT}`);
});

// Attach WebSocket to same port as HTTP
const wsServer = new WebSocket.Server({ server });

// Handle incoming UDP messages - just broadcast them
udpServer.on('message', (msg) => {
    udpServer.setBroadcast(true);
    udpServer.send(msg, UDP_PORT, '255.255.255.255');
});

// Handle web client messages - just forward to UDP
wsServer.on('connection', (ws) => {
    ws.on('message', (msg) => {
        udpServer.setBroadcast(true);
        udpServer.send(Buffer.from(msg), UDP_PORT, '255.255.255.255');
    });
});

// Serve static files
app.use(express.static('public'));

udpServer.bind(UDP_PORT, () => {
    console.log(`UDP broadcast server running on port ${UDP_PORT}`);
});