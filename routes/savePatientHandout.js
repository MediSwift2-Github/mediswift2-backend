const express = require('express');
const router = express.Router();
const Patient = require('../database/patient-schema');

async function sendPatientHandout(chatId, patientHandout) {
    
}

// Endpoint to save the patient handout
router.post('/api/savePatientHandout', async (req, res) => {
    const { patientId, patientHandout, summaryDate } = req.body;

    if (!patientId || !patientHandout || !summaryDate) {
        return res.status(400).send('Missing patient ID, handout data, or summary date.');
    }

    try {
        const patientData = await storePatientHandout(patientId, patientHandout, summaryDate);
        if (patientData) {
            const chatId = patientData.mobile_number;  // Assuming `mobile_number` is directly available
            res.json({ status: 'success', message: 'Patient handout stored and sent successfully!', patientId: patientId });
        } else {
            res.status(404).send('Patient not found.');
        }
    } catch (error) {
        console.error("Failed to store or send patient handout:", error);
        res.status(500).send('Failed to store or send patient handout.');
    }
});


async function storePatientHandout(patientId, patientHandout, summaryDate) {
    try {
        const dateStart = new Date(summaryDate);
        const dateEnd = new Date(summaryDate);
        dateEnd.setDate(dateEnd.getDate() + 1);

        const updateResult = await Patient.findOneAndUpdate({
            _id: patientId,
            'sessionSummaries.summaryDate': {
                $gte: dateStart,
                $lt: dateEnd
            }
        }, {
            $set: { 'sessionSummaries.$.patientHandout': patientHandout }
        }, { new: true, upsert: true });

        if (!updateResult) {
            // If no existing summary is found, add a new one
            await Patient.findByIdAndUpdate(patientId, {
                $push: { 'sessionSummaries': { summaryDate, patientHandout } }
            }, { new: true });
        }

        console.log("Successfully stored patient handout.");
    } catch (error) {
        console.error("Error storing patient handout:", error);
    }
}

module.exports = router;
