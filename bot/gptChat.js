// gptChat.js using CommonJS
const { OpenAI } = require("openai");
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const openai = new OpenAI(process.env.OPENAI_API_KEY);


// Function to create a system-level prompt from the patient's medical history
function createSystemPrompt(medicalHistory) {
    if (medicalHistory && medicalHistory.length > 0) {
        const historyJSON = JSON.stringify(medicalHistory, null, 2); // Convert array of objects to JSON
        return {
            role: "system",
            content: `You are a medical assistant. Here is the patient's medical history: ${historyJSON}\nBased on this history, explain the medical history of the patient and answer questions he has for himself.`
        };
    } else {
        // No medical history present
        return {
            role: "system",
            content: `You are MediSwift, a virtual medical assistant designed to aid doctor, you are chatting with a patient inside a hospital sitting in the waiting area. After your chat the patient will meet the doctor. Your role is to gather information about the patient's current health concerns in a step-by-step manner. You do not provide diagnoses or medical advice. As soon as you receive message start asking question(try to start conversation with a message like "Can you please tell me the problem you are facing"). Ask one question at a time based on the patient's responses. Gather detailed information that will help the doctor understand the patient's condition better. Since the doctor does not know about the patient help him know about underlying conditions like allergies or past medical issues by asking the patient.
`
        };
    }
}


async function chatWithGPT(prompt, conversationHistory, medicalHistory) {

    const systemLevelPrompt = createSystemPrompt(medicalHistory);

    // Ensure the system-level prompt is always at the beginning of the conversation history
    if (conversationHistory.length === 0 || (conversationHistory[0] && conversationHistory[0].role !== "system")) {
        conversationHistory.unshift(systemLevelPrompt);
    }

    conversationHistory.push({ role: "user", content: prompt });

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: conversationHistory,
        });

        const modelMessage = response.choices[0].message.content;
        conversationHistory.push({ role: "assistant", content: modelMessage });

        return { success: true, content: modelMessage, conversationHistory };
    } catch (error) {
        console.error('Error communicating with OpenAI:', error);
        return { success: false, error: error.message, conversationHistory };
    }
}
async function summarizeConversation(conversationHistory) {
    // Filter out system messages before summarization
    const filteredHistory = conversationHistory.filter(message => message.role !== "system");
    console.log(filteredHistory);
    // Construct a prompt that asks GPT to summarize the conversation
    const summaryPrompt = {
        role: "system",
        content: "You are part of a virtual medical assistant designed to aid doctor. A chatbot was deployed that talked to the patient to gather detailed information about their concerns, symptoms , medical history etc to help doctor know the purpose of the visit while also providing all the details retrieved during the chat. Your job is to understand the conversation and make a detailed clinical notes that includes all the medical details, while taking care of not adding any noise or unwanted details. The report will be further processed by gpt-3.5, so write it in a way that is convinent for it. This is the conversation:",
    };

    // Add the summary prompt at the beginning of the conversation history
    filteredHistory.unshift(summaryPrompt);

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: filteredHistory, // Use the filtered and updated history here
        });

        const summaryMessage = response.choices[0].message.content;
        console.log(summaryMessage);
        // Call convertSummaryToJSON right after the summary is generated
        await convertSummaryToJSON(summaryMessage);
        return { success: true, content: summaryMessage };
    } catch (error) {
        console.error('Error generating summary with OpenAI:', error);
        return { success: false, error: error.message };
    }
}

async function convertSummaryToJSON(summary) {
    const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-0125",
        messages: [
            {
                role: "system",
                content: "You are a helpful assistant designed to output JSON. Given a medical summary, output a structured JSON object with fields for purpose of visit, chronicDiseases, acuteSymptoms, allergies, medications, previousTreatments, patientConcerns, infectiousDiseaseExposure, nutritionalStatus, familyMedicalHistory, and lifestyleFactors. If information for a field is not available in the summary, set that field to null."
            },
            {
                role: "user",
                content: summary
            }
        ],
        response_format: { type: "json_object" },
    });
    console.log(completion.choices[0].message.content);
    return completion.choices[0].message.content;
}

// Function to transcribe audio using the OpenAI Whisper API
async function transcribeAudio(audioFilePath) {
    console.log('TranscribeAudio called with path:', audioFilePath);

    try {
        const fullPath = path.resolve(audioFilePath);
        console.log('Resolved full path:', fullPath);

        if (!fs.existsSync(fullPath)) {
            console.error('File does not exist at path:', fullPath);
            return { success: false, error: 'File does not exist' };
        }

        const formData = new FormData();
        formData.append('file', fs.createReadStream(fullPath));
        formData.append('model', 'whisper-1');

        // Log the headers and API URL before the request
        const apiURL = 'https://api.openai.com/v1/audio/transcriptions';
        console.log('API URL:', apiURL);
        console.log('Headers:', { ...formData.getHeaders(), 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` });

        console.log('Sending request to OpenAI for transcription...');
        const response = await axios.post(apiURL, formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            responseType: 'json'
        });

        console.log('Transcription received:', response.data);
        return { success: true, content: response.data.text };
    } catch (error) {
        console.error('Error transcribing audio with OpenAI:', error.message);

        // Log the error response from OpenAI, if available
        if (error.response) {
            console.error('OpenAI response:', error.response.data);
        }

        return { success: false, error: error.message };
    }
}

async function convertMedicalSummaryToNotes(summary, medicalHistory) {
    const historyContext = medicalHistory.map(entry => `${entry.visitDate}: ${JSON.stringify(entry.notes)}`).join('\n');
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-0125",
            messages: [
                {
                    role: "system",
                    content: `Here is the existing medical history: ${historyContext}\nBased on this history, generate notes for the new visit without repeating information. Output should be in JSON format with fields for purpose of visit, chronicDiseases, acuteSymptoms, allergies, medications, previousTreatments, patientConcerns, infectiousDiseaseExposure, nutritionalStatus, familyMedicalHistory, and lifestyleFactors.`
                },
                {
                    role: "user",
                    content: summary
                }
            ],
            response_format: { type: "json_object" },
        });
        console.log('Converted Notes:', response.choices[0].message.content);
        return response.choices[0].message.content;
    } catch (error) {
        console.error('Error in convertMedicalSummaryToNotes:', error);
        return null;
    }
}


module.exports = {
    chatWithGPT,
    summarizeConversation,
    convertSummaryToJSON,
    transcribeAudio,
    convertMedicalSummaryToNotes
};


