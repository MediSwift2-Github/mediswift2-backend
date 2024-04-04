const express = require('express');
const router = express.Router();// and Queue model is imported
const mongoose = require('mongoose');
const Queue = require('../database/queue-schema');
const Patient =require('../database/patient-schema');
// Endpoint to add a patient to the queue
router.post('/api/queue/add', async (req, res) => {
    try {
        const { patientId } = req.body;

        // First, check if the patient already exists in the queue
        const existingEntry = await Queue.findOne({ patientId });
        if (existingEntry) {
            return res.status(400).send('Patient is already in the queue.');
        }

        // Then, find the patient by ID to get their details
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).send('Patient not found.');
        }

        // Now that we have the patient's details, create a new queue entry with them
        const queueEntry = new Queue({
            patientId,
            patientName: patient.name, // Use the patient's name from the Patient document
            patientMobileNumber: patient.mobile_number // Use the patient's mobile number from the Patient document
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
        const queueEntries = await Queue.find({}).sort({ queueEntryTime: 1 }).exec();
        if (queueEntries.length === 0) {
            console.log('No queue entries found');
            return res.status(404).send('No queue entries found.');
        }
        console.log('Queue entries retrieved:', queueEntries);
        res.status(200).send(queueEntries);
    } catch (error) {
        console.error('Error retrieving queue entries:', error);
        res.status(500).send('Error retrieving queue entries');
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

