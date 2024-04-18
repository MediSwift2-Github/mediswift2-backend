const express = require('express');
const router = express.Router();
const Patient = require('../database/patient-schema');
const { OpenAI } = require("openai");

const openai = new OpenAI(process.env.OPENAI_API_KEY);

router.get('/getSummary', async (req, res) => {
    try {
        const { _id, date } = req.query;
        console.log("Received params:", req.query);

        const patient = await Patient.findById(_id);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        const summaryDate = new Date(date);
        summaryDate.setHours(0, 0, 0, 0);
        const summary = patient.sessionSummaries.find(s => {
            const sDate = new Date(s.summaryDate);
            sDate.setHours(0, 0, 0, 0);
            return sDate.getTime() === summaryDate.getTime();
        });

        if (!summary) {
            return res.status(404).json({ message: 'Summary for the specified date not found' });
        }

        const ehrResponse = await createEHRentry(summary.summaryContent, summary.transcription);
        const handoutResponse = await createHandout(summary.summaryContent, summary.transcription);
        console.log('Data type of EHR content:', typeof ehrResponse.content);
        console.log('Data type of Handout content:', typeof handoutResponse.content);
        if (ehrResponse.success && handoutResponse.success) {
            res.json({ ehrContent: ehrResponse.content, handoutContent: handoutResponse.content });
        } else {
            res.status(500).json({
                message: 'Failed to create EHR or Handout entry',
                errors: { ehrError: ehrResponse.error, handoutError: handoutResponse.error }
            });
        }
    } catch (error) {
        console.error('Error retrieving patient summary:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

async function createEHRentry(summaryContent, transcription) {
    return await createOpenAIResponse("You are a helpful assistant designed to output JSON. Given a summary of the purpose of visit and a transcription of the conversation between doctor and patient, output a structured JSON object that makes sense for an electronic health record (EHR) entry.", summaryContent, transcription);
}

async function createHandout(summaryContent, transcription) {
    return await createOpenAIResponse("Create a handout for the patient based on his problems. This handout should be a JSON that contains Do's, Dont's and Dietary restrictions.", summaryContent, transcription);
}

async function createOpenAIResponse(systemInstruction, summaryContent, transcription) {
    const systemPrompt = {
        role: "system",
        content: systemInstruction
    };

    const userPrompt = {
        role: "user",
        content: `${summaryContent}  and  ${transcription}`
    };

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-0125",
            messages: [systemPrompt, userPrompt],
            response_format: { "type": "json_object" }
        });

        const jsonResponse = response.choices[0].message.content;
        const parsedResponse = JSON.parse(jsonResponse);
        console.log('Data type of the parsed JSON response:', typeof parsedResponse);
        return { success: true, content: parsedResponse };
    } catch (error) {
        console.error(`Error creating response with OpenAI:`, error);
        return { success: false, error: error.message };
    }
}

module.exports = router;
