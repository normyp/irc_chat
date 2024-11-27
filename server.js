const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);

// Serve static files from 'public' directory
app.use(express.static('public'));

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);

// URL detection regex pattern
const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([^\s]+\.(com|net|org|edu|gov|mil|biz|info|io|uk|de|ru|co|us|me|app))/gi;

// Serve static files from 'public' directory
app.use(express.static('public'));

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('chat message', (msg) => {
        // Check for URLs in the message
        if (urlPattern.test(msg.text)) {
            console.log('Blocked message containing URL');
            socket.emit('message blocked', { error: 'URLs are not allowed in messages' });
            return;
        }
        
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
    console.log('A user connected');

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});