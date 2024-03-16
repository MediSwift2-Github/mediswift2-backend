const express = require('express');
require('./database'); // Connect to MongoDB
const cors = require('cors');
const bodyParser = require('body-parser');
const loginRoute = require('./routes/login'); // Make sure to create this route file

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Use the login route
app.use(loginRoute);

app.get('/', (req, res) => res.send('MediSwift API Running'));

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
