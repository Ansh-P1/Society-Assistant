const express = require('express');
const cors = require('cors');
const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);

app.use(errorHandler);

module.exports = app;
