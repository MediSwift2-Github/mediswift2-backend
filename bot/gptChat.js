// gptChat.js using CommonJS
const { OpenAI } = require("openai");

const openai = new OpenAI(process.env.OPENAI_API_KEY);

async function chatWithGPT(prompt, conversationHistory) {
    conversationHistory.push({ role: "user", content: prompt });

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-0125",
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
