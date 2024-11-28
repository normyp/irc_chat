const dgram = require('dgram');
const express = require('express');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const path = require('path');
const app = express();

// Use Render's PORT env var or fallback to local dev ports
const PORT = process.env.PORT || 3000;

// Create HTTP server with minimal settings
const server = app.listen(PORT, () => {
    console.log(`Web server running on port ${PORT}`);
});

// WebSocket with no heartbeat/ping
const wsServer = new WebSocket.Server({ 
    server,
    clientTracking: false // Don't track clients
});

// Single UDP client for all connections
const udpClient = spawn('node', [path.join(__dirname, 'client.js')], {
    stdio: ['pipe', 'pipe', 'pipe']
});

// Handle connections with minimal overhead
wsServer.on('connection', (ws) => {
    // Stream UDP output directly
    udpClient.stdout.on('data', (data) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data.toString());
        }
    });

    // Forward messages directly
    ws.on('message', (msg) => {
        udpClient.stdin.write(msg + '\n');
    });
});

// Serve static files with no caching
app.use(express.static('public', {
    etag: false,
    lastModified: false
}));