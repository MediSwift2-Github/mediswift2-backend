const express = require('express');
require('./database/database'); // Connect to MongoDB
const cors = require('cors');
const bodyParser = require('body-parser');
const loginRoute = require('./routes/login'); // Make sure to create this route file
const patientRoutes = require('./routes/add-patient');
const searchPatient = require('./routes/search-patient');
const queue = require('./routes/queue-add');
const setupRealtimeUpdates = require('./realtimeUpdates');
const http = require('http');
const audioTranscription = require('./routes/audioTranscription');
const documentationRoute = require('./routes/documentation');
const saveHealthRecordRouter = require('./routes/saveHealthRecord');
const patientHandoutRoutes = require('./routes/savePatientHandout');




const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);

// Environment-specific CORS origins
const allowedOrigins = [
    'http://localhost:3001',  // Local frontend
    'https://mediswift-frontend.vercel.app'  // Vercel frontend
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);  // Allow CORS for this origin
        } else {
            callback(new Error('Not allowed by CORS'));  // Block CORS for this origin
        }
    },
    credentials: true,  // Important for sessions or when using cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Apply CORS with options
app.use(cors(corsOptions));
app.use(bodyParser.json());


// Use the login route
app.use(loginRoute);
app.use(patientRoutes);
app.use(searchPatient);
app.use(queue);
app.use(audioTranscription);
app.use(documentationRoute);
app.use(saveHealthRecordRouter);
app.use(patientHandoutRoutes);
setupRealtimeUpdates(server);

app.get('/', (req, res) => res.send('MediSwift API Running'));

// Start the server
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// In server.js
 require('./bot/telegrambot');
