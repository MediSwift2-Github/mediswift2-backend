const TelegramBot = require('node-telegram-bot-api');
const chatWithGPT = require('./gptChat');
const Queue = require('../database/queue-schema');

const token = '6966801360:AAF7d2ec-Fq5yWKO9bgwn9N-CtgdbvhIAsk';
const bot = new TelegramBot(token, {polling: true});

// const chatIds = [7125737634, 1039076028, 1948780510];

// Store conversation histories indexed by chat ID
let conversations = {};
let sessionStartTimes = {};

const SESSION_DURATION = 1 * 60 * 1000; // 10 minutes in milliseconds

const isMobileNumberInQueue = async (mobileNumber) => {
    try {
        const queueEntries = await Queue.find({})
            .populate('patientId', 'mobile_number _id')
            .exec();

        for (let entry of queueEntries) {
            if (entry.patientId && entry.patientId.mobile_number === mobileNumber) {
                return true; // Found a match
            }
        }
        return false; // No match found
    } catch (error) {
        console.error("Error checking mobile number in queue:", error);
        return false;
    }
};



bot.on('message', async (msg) => {
    const chatId = msg.chat.id; // Unique identifier for each conversation/user
    const userMessage = msg.text;
    const isInQueue = await isMobileNumberInQueue(chatId.toString());

    if (userMessage === '/start') {
        await bot.sendMessage(chatId, `Welcome! Your chat ID is ${chatId}. Please submit this ID on the website to get access to the bot.`);
    }

    if (!isInQueue) {
        await bot.sendMessage(chatId, "You are not currently in the queue or your session has expired.");
        return; // Prevent further processing if the user isn't in the queue
    }


    // Check for session restart command
    if (userMessage === '/restart') {
        sessionStartTimes[chatId] = Date.now(); // Resets or starts the session timer
        conversations[chatId] = []; // Optionally reset the conversation history
        await bot.sendMessage(chatId, `Your session has been restarted. You have 10 more minutes.`);
        return;
    }

    // Proceed with session and conversation handling
    if (!sessionStartTimes[chatId]) {
        // First message from the user in a session
        sessionStartTimes[chatId] = Date.now();
    } else if (sessionStartTimes[chatId] === 'expired') {
        // Session expired and not restarted
        await bot.sendMessage(chatId, "Your session has expired. Please send /restart to begin a new session.");
        return;
    } else if (Date.now() - sessionStartTimes[chatId] > SESSION_DURATION) {
        // Session expired
        sessionStartTimes[chatId] = 'expired';
        await bot.sendMessage(chatId, "Your session has expired. Please send /restart to begin a new session.");
        return;
    }

    // Proceed with normal message processing
    if (!conversations[chatId]) {
        conversations[chatId] = [];
    }

    let conversationHistory = conversations[chatId];
    const { success, content, conversationHistory: updatedHistory } = await chatWithGPT(userMessage, conversationHistory);

    conversations[chatId] = updatedHistory;

    if (success) {
        await bot.sendMessage(chatId, content);
    } else {
        await bot.sendMessage(chatId, `Sorry, I encountered an error: ${content}`);
    }
});

// Stores each user's conversation history


module.exports = bot;
