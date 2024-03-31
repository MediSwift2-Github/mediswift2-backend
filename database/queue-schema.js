const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    queueEntryTime: {
        type: Date,
        default: Date.now,
        required: true
    },
    status: {
        type: String,
        enum: ['Chatting', 'Completed', 'End Chat'],
        default: 'Chatting'
    }
});

const Queue = mongoose.model('Queue', queueSchema);

module.exports = Queue;
