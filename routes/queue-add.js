const express = require('express');
const router = express.Router();// and Queue model is imported
const mongoose = require('mongoose');
const Queue = require('../database/queue-schema');
// Endpoint to add a patient to the queue
router.post('/api/queue/add', async (req, res) => {
    try {
        const { patientId } = req.body;

        // Create a new queue entry
        const queueEntry = new Queue({
            patientId
        });

        // Save the queue entry
        await queueEntry.save();

        res.status(201).send(queueEntry);
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message);
    }
});
// Endpoint to view the queue
router.get('/api/queue', async (req, res) => {
    try {
        const queueEntries = await Queue.find({})
            .populate('patientId', 'name')
            .sort({ queueEntryTime: 1 }) // Sort by entry time
            .exec();

        res.status(200).send(queueEntries);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});
// Endpoint to update the status of a queue entry
router.patch('/api/queue/update/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        const updatedEntry = await Queue.findByIdAndUpdate(id, { status }, { new: true });

        if (!updatedEntry) {
            return res.status(404).send('Queue entry not found.');
        }

        res.status(200).send(updatedEntry);
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message);
    }
});

module.exports = router;

