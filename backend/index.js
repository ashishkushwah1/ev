const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const router = require('./routes/index');
app.use(cors());
app.use(express.json());

app.use('/api', router);

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
