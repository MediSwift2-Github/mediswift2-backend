const express = require('express');
const multer = require('multer');
const { transcribeAudio } = require('../bot/gptChat'); // Adjust the path as necessary
const router = express.Router();
const path = require('path');
const {storeTranscription} = require("./storeSessionJSON");

// Configure Multer for audio file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/audio/') // Make sure this directory exists
    },
    filename: function(req, file, cb) {
        // Generate a unique filename for the audio file
        cb(null, `${file.fieldname}-${Date.now()}.mp3`)
    }
});

const upload = multer({ storage: storage });


router.post('/api/audio/upload', upload.single('audioFile'), async (req, res) => {
    console.log('Received audio upload request', req.file ? `for file: ${req.file.filename}` : 'without file');
    console.log('Request body:', req.body); // Add this line to log the request body
    if (!req.file) {
        console.log('No file uploaded');
        return res.status(400).send('No file uploaded.');
    }

    console.log('File uploaded:', req.file.path);

    try {
        console.log('Sending file for transcription:', req.file.path);

        const transcriptionResult = await transcribeAudio(req.file.path);

        if (transcriptionResult.success) {
            const patientId = req.body.patientId; // Extracted from FormData
            // Assuming summaryDate is also passed from the frontend
            const summaryDate = req.body.summaryDate ? new Date(req.body.summaryDate) : new Date();

            // Store the transcription in the patient's document
            await storeTranscription(patientId, transcriptionResult.content, summaryDate);

            res.send({
                message: 'Audio file uploaded, transcribed, and transcription saved successfully.',
                transcription: transcriptionResult.content,
                fileDetails: req.file
            });
        } else {
            console.error('Transcription failed:', transcriptionResult.error);
            res.status(500).send({
                message: 'Failed to transcribe audio file.',
                error: transcriptionResult.error
            });
        }
    } catch (error) {
        console.error('Error during file processing:', error.message);
        res.status(500).send({ message: 'Server error during transcription.', error: error.message });
    }
});

module.exports = router;
