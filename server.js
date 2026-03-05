const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => res.render('index'));
app.get('/room/:room', (req, res) => res.render('room', { roomId: req.params.room }));

const roomHosts = {}; 

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId, userName) => {
        socket.join(roomId);
        if (!roomHosts[roomId]) roomHosts[roomId] = userId;
        const isHost = roomHosts[roomId] === userId;

        socket.emit('permissions', isHost);
        socket.to(roomId).emit('user-connected', userId, userName);

        socket.on('message', (msg) => {
            io.to(roomId).emit('createMessage', msg, userName);
        });

        socket.on('end-meeting', () => {
            if (roomHosts[roomId] === userId) {
                io.to(roomId).emit('meeting-ended');
                delete roomHosts[roomId];
            }
        });

        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', userId);
            if (roomHosts[roomId] === userId) delete roomHosts[roomId];
        });
    });
});

server.listen(PORT, () => console.log(`Active on ${PORT}`));
