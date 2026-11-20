require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

const apiRoutes = require('./src/routes/api');
const adminRoutes = require('./src/routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Security & Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Trust reverse proxy headers (X-Forwarded-Host)
app.set('trust proxy', true);

// Serve static assets directly (images, css, js, fonts)
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

// Clean URLs & Page Routing for Official Website
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return next();
  }

  const rawHost = req.headers['x-forwarded-host'] || req.headers.host || req.hostname || '';
  const host = String(rawHost).split(',')[0].trim().toLowerCase();
  if (host.startsWith('admin.')) {
    return res.sendFile(path.join(__dirname, 'public/admin.html'));
  }

  let clean = req.path;
  if (clean.length > 1 && clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }

  // Redirect legacy /hi to default English homepage
  if (clean === '/hi' || clean === '/hi.html') {
    return res.redirect(301, '/');
  }

  if (!clean || clean === '/' || clean === '/index') {
    return res.sendFile(path.join(__dirname, 'public/index.html'));
  }

  // 1. Check if direct static file exists in public/ (e.g. /sitemap.xml, /robots.txt, /manifest.webmanifest)
  const directPath = path.join(__dirname, 'public', clean);
  if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
    return res.sendFile(directPath);
  }

  // 2. Check if clean.html exists (e.g. /mobile-recharge -> /public/mobile-recharge.html)
  const candidateHtml = path.join(__dirname, 'public', clean + '.html');
  if (fs.existsSync(candidateHtml) && fs.statSync(candidateHtml).isFile()) {
    return res.sendFile(candidateHtml);
  }

  // 3. Check if clean/index.html exists
  const nestedIndex = path.join(__dirname, 'public', clean, 'index.html');
  if (fs.existsSync(nestedIndex) && fs.statSync(nestedIndex).isFile()) {
    return res.sendFile(nestedIndex);
  }

  // 4. Default 404 fallback: serve index.html
  res.status(404).sendFile(path.join(__dirname, 'public/index.html'));
});

// Health Check API
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'FlamePay Backend & Official Platform',
    version: '1.0.0',
    landingUrl: 'https://flamepay.in/',
    adminPanelUrl: 'https://admin.flamepay.in/',
    apiDocumentation: '/api/v1',
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
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
  console.log(`🌐 Official Website: http://${HOST}:${PORT}/`);
  console.log(`⚡ Admin Dashboard:  /admin or http://${HOST}:${PORT}/admin`);
  console.log(`🚀 API Base URL:     /api/v1`);
  console.log('==================================================');
});
