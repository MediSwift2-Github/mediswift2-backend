const express = require('express');
const router = express.Router();
const Patient = require('../database/patient-schema');
const fetch = require('node-fetch');
const Queue = require('../database/queue-schema');


const TELEGRAM_API = 'https://api.telegram.org/bot';
const TOKEN = '6966801360:AAF7d2ec-Fq5yWKO9bgwn9N-CtgdbvhIAsk';



// Endpoint to save the patient handout
router.post('/api/savePatientHandout', async (req, res) => {
    const { patientId, patientHandout, summaryDate } = req.body;

    if (!patientId || !patientHandout || !summaryDate) {
        return res.status(400).send('Missing patient ID, handout data, or summary date.');
    }

    try {
        const patientData = await storePatientHandout(patientId, patientHandout, summaryDate);
        if (patientData) {
            const chatId = patientData.mobile_number;  // Extract the mobile number
            await sendTelegramMessage(chatId, `Here is your patient handout:\n${patientHandout}`);

            // Attempt to update the queue status to 'Completed'
            updateQueueStatus(patientId, 'Completed').catch(error => {
                console.error("Failed to update queue status:", error);
            });

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
    const dateStart = new Date(summaryDate);
    const dateEnd = new Date(summaryDate);
    dateEnd.setDate(dateEnd.getDate() + 1);

    try {
        let updateResult = await Patient.findOneAndUpdate({
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
            updateResult = await Patient.findByIdAndUpdate(patientId, {
                $push: { 'sessionSummaries': { summaryDate, patientHandout } }
            }, { new: true });
        }

        console.log("Successfully stored patient handout.");
        return updateResult;  // Return the patient data after update
    } catch (error) {
        console.error("Error storing patient handout:", error);
        throw error;  // Rethrow the error to handle it in the calling function
    }
}



async function sendTelegramMessage(chatId, text) {
    const url = `${TELEGRAM_API}${TOKEN}/sendMessage`;

    // Replace unsupported HTML tags with Telegram-supported or plain text
    const sanitizedText = text.replace(/<p>/gi, '').replace(/<\/p>/gi, '\n')
        .replace(/<strong>/gi, '<b>').replace(/<\/strong>/gi, '</b>');

    const body = {
        chat_id: chatId,
        text: sanitizedText,
        parse_mode: 'HTML'
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const responseData = await response.json();
        console.log('Message sent successfully:', responseData);
    } catch (error) {
        console.error('Failed to send message:', error);
    }
}

async function updateQueueStatus(patientId, newStatus) {
    try {
        const queueEntry = await Queue.findOneAndUpdate(
            { patientId: patientId, status: 'Chatting' }, // Ensures it only updates if the current status is 'Chatting'
            { status: newStatus },
            { new: true }
        );

        if (!queueEntry) {
            console.log('No queue entry found for this patient ID or the status is not "Chatting".');
        } else {
            console.log('Queue status updated to:', queueEntry.status);
        }
    } catch (error) {
        console.error('Error updating the queue status:', error);
        throw error;  // This error is caught in the caller
    }
}

module.exports = router;
