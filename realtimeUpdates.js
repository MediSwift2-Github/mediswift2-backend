// utils/realtimeUpdates.js
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const setupRealtimeUpdates = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*", // Adjust this to match your frontend's origin
            methods: ["GET", "POST"], // Specify allowed request methods
            credentials: true, // If your frontend needs to send cookies or credentials
        },
    });
    const queueCollectionName = 'queues'; // Adjust to your actual queue collection name

    mongoose.connection.once('open', () => {
        console.log('MongoDB connection is open. Setting up change streams.');

        const changeStream = mongoose.connection.collection(queueCollectionName).watch();
        changeStream.on('change', (change) => {
            console.log('Change detected in queue:', change);
            // Emit change to all connected clients
            io.emit('queueUpdate', change);
        });
    });

    io.on('connection', (socket) => {
        console.log('A user connected to the WebSocket.');

        socket.on('disconnect', () => {
            console.log('User disconnected from the WebSocket.');
        });
    });
};

module.exports = setupRealtimeUpdates;
