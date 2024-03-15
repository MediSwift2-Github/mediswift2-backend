const express = require('express');
const bodyParser = require('body-parser');
require('./database'); // Connect to MongoDB

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Define routes here. For example:
app.get('/', (req, res) => res.send('MediSwift API Running'));

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
