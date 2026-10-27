require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');

const apiRoutes = require('./src/routes/api');
const adminRoutes = require('./src/routes/admin');

const app = express();
const PORT = process.env.PORT || 4000;
const HOST = '0.0.0.0';

// Security & Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static files (Admin Web Dashboard)
app.use(express.static(path.join(__dirname, 'public')));

// Mount API Routes (matches Flutter mobile app endpoints)
app.use('/api/v1', apiRoutes);

// Mount Admin Routes
app.use('/api/v1/admin', adminRoutes);

// Admin Web App Route (SPA)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Root Health Check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    app: 'FlamePay Backend & Admin Engine',
    version: '1.0.0',
    adminPanelUrl: `/admin`,
    apiDocumentation: `/api/v1`,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, HOST, () => {
  console.log('==================================================');
  console.log(`🔥 FlamePay Backend Server is RUNNING on ${HOST}:${PORT}`);
  console.log(`🌐 API Base URL:    /api/v1`);
  console.log(`⚡ Admin Dashboard: /admin`);
  console.log('==================================================');
});
