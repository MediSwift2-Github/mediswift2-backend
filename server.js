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


setupRealtimeUpdates(server);
app.use(cors());
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


app.get('/', (req, res) => res.send('MediSwift API Running'));

// Start the server
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// In server.js
require('./bot/telegramBot');
