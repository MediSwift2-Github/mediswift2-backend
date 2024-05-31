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
        dateStart.setHours(0, 0, 0, 0);
        const dateEnd = new Date(summaryDate);
        dateEnd.setDate(dateEnd.getDate() + 1); // Move to the next day
        dateEnd.setHours(0, 0, 0, 0);

        // Find the patient document
        const patient = await Patient.findById(patientId);

        if (!patient) {
            console.error("Patient not found");
            return;
        }

        // Check if a session summary exists for the given date range
        const existingSummary = patient.sessionSummaries.find(s => {
            const sDate = new Date(s.summaryDate);
            sDate.setHours(0, 0, 0, 0);
            return sDate.getTime() >= dateStart.getTime() && sDate.getTime() < dateEnd.getTime();
        });

        if (existingSummary) {
            // If an existing summary is found, update its transcription
            existingSummary.transcription = transcription;
            console.log("Transcription updated in existing summary.");
        } else {
            // If no summary exists, create a new one with the transcription
            patient.sessionSummaries.push({
                summaryDate: dateStart,
                transcription: transcription,
                summaryContent: "" // Initialize with empty summaryContent
            });
            console.log("New summary created with transcription.");
        }

        // Save the patient document
        await patient.save();
        console.log("Successfully stored transcription.");
    } catch (error) {
        console.error("Error storing transcription:", error);
    }
}




module.exports = { storeSessionSummary,storeTranscription};
