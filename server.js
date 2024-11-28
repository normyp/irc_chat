const dgram = require('dgram');
const express = require('express');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const path = require('path');
const app = express();

// Use Render's PORT env var or fallback to local dev ports
const PORT = process.env.PORT || 3000;

// Create WebSocket server attached to HTTP server
const server = app.listen(PORT, () => {
    console.log(`Web server running on port ${PORT}`);
});

// Attach WebSocket to same port as HTTP
const wsServer = new WebSocket.Server({ server });

// Spawn UDP client process
const udpClient = spawn('node', [path.join(__dirname, 'client.js')], {
    stdio: ['pipe', 'pipe', 'pipe']
});

// Handle web client connections
wsServer.on('connection', (ws) => {
    // Stream UDP client output to web terminal
    udpClient.stdout.on('data', (data) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data.toString());
        }
    });

    // Handle messages from web client
    ws.on('message', (msg) => {
        // Send to UDP client's stdin
        udpClient.stdin.write(msg + '\n');
    });
});

// Serve static files
app.use(express.static('public'));