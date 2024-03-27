const TelegramBot = require('node-telegram-bot-api');
const chatWithGPT = require('./gptChat');


const token = '6966801360:AAF7d2ec-Fq5yWKO9bgwn9N-CtgdbvhIAsk';
const bot = new TelegramBot(token, {polling: true});

const chatId = 7125737634;

// Send a test message to the specific chat ID
// bot.sendMessage(chatId, "Hello! This is a test message.");
let conversationHistory = [];


bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userMessage = msg.text;

    if (userMessage === '/start') {
        // Respond with the chat ID
        await bot.sendMessage(chatId, `Your chat ID is: ${chatId}`);
        return; // Stop further processing
    }

    // Proceed with your existing GPT chat functionality
    const { success, content, conversationHistory: updatedHistory } = await chatWithGPT(userMessage, conversationHistory);
    conversationHistory = updatedHistory;

    if (success) {
        await bot.sendMessage(chatId, content);
    } else {
        await bot.sendMessage(chatId, `Sorry, I encountered an error: ${content}`);
    }
});
module.exports = bot;
