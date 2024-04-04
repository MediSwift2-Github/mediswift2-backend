// gptChat.js using CommonJS
const { OpenAI } = require("openai");

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

module.exports = chatWithGPT;

