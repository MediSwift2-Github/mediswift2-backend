const Patient = require('../database/patient-schema');


async function storeSessionSummary(patientId, summaryJSON) {
    try {
        // Find the patient by ID and update their record with the new summary
        await Patient.findByIdAndUpdate(patientId, {
            $push: { sessionSummaries: { summaryContent: summaryJSON } } // Use $push to add to the array
        }, { new: true }); // Return the updated document

        console.log("Successfully stored session summary.");
    } catch (error) {
        console.error("Error storing session summary:", error);
    }
}

async function storeTranscription(patientId, transcription, summaryDate) {
    try {
        // Parse the incoming date and create a range for the entire day
        const dateStart = new Date(summaryDate);
        const dateEnd = new Date(summaryDate);
        dateEnd.setDate(dateEnd.getDate() + 1); // Move to the next day

        // Find the patient and update the session summary within the specified date range
        await Patient.findOneAndUpdate({
            _id: patientId,
            'sessionSummaries.summaryDate': {
                $gte: dateStart, // Greater than or equal to the start of the day
                $lt: dateEnd // But less than the start of the next day
            }
        }, {
            $set: { 'sessionSummaries.$.transcription': transcription } // Update the transcription field
        }, { new: true });

        console.log("Successfully stored transcription.");
    } catch (error) {
        console.error("Error storing transcription:", error);
    }
}




module.exports = { storeSessionSummary,storeTranscription};
