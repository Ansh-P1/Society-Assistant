const express = require('express');
const cors = require('cors');
const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');
const complaintsRouter = require('./routes/complaints');
const adminComplaintsRouter = require('./routes/adminComplaints');
const adminSettingsRouter = require('./routes/adminSettings');
const noticesRouter = require('./routes/notices');
const adminDashboardRouter = require('./routes/adminDashboard');
const { UPLOADS_DIR } = require('./middleware/upload');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/complaints', complaintsRouter);
app.use('/api/admin/complaints', adminComplaintsRouter);
app.use('/api/admin/settings', adminSettingsRouter);
app.use('/api/notices', noticesRouter);
app.use('/api/admin/dashboard', adminDashboardRouter);

app.use(errorHandler);

module.exports = app;
