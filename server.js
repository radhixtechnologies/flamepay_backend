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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Trust Hostinger / reverse proxy headers (X-Forwarded-Host)
app.set('trust proxy', true);

// Static files (Assets, CSS, JS) — index: false so `/` is routed by hostname below!
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Mount API Routes (matches Flutter mobile app endpoints)
app.use('/api/v1', apiRoutes);

// Mount Admin Routes
app.use('/api/v1/admin', adminRoutes);

// Admin Web App Route (SPA)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});

// Root Route:
// If accessed via admin.flamepay.in -> serves Admin Portal (admin.html)
// Otherwise (flamepay.in, localhost, etc.) -> serves Official Landing Page (index.html)
app.get('/', (req, res) => {
  const rawHost = req.headers['x-forwarded-host'] || req.headers.host || req.hostname || '';
  const host = String(rawHost).split(',')[0].trim().toLowerCase();
  if (host.startsWith('admin.')) {
    return res.sendFile(path.join(__dirname, 'public/admin.html'));
  }
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Health Check API
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'FlamePay Backend & Landing Engine',
    version: '1.0.0',
    landingUrl: 'https://flamepay.in/',
    adminPanelUrl: 'https://admin.flamepay.in/',
    apiDocumentation: '/api/v1',
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler (prevents unhandled crashes -> 503)
app.use((err, req, res, next) => {
  console.error('[Express Unhandled Error]:', err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]:', err);
});

app.listen(PORT, HOST, () => {
  console.log('==================================================');
  console.log(`🔥 FlamePay Backend Server is RUNNING on ${HOST}:${PORT}`);
  console.log(`🌐 Landing Page:    https://flamepay.in/ or http://${HOST}:${PORT}/`);
  console.log(`⚡ Admin Dashboard: /admin or https://admin.flamepay.in/`);
  console.log(`🚀 API Base URL:    /api/v1`);
  console.log('==================================================');
});
