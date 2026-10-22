// CureLink Server
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Validate deployment configuration before loading the application.
const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'CLIENT_URL'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]?.trim());
if (missingEnv.length) {
  console.error(`Missing required environment variable(s): ${missingEnv.join(', ')}`);
  process.exit(1);
}
const configuredOrigins = process.env.CLIENT_URL.split(',').map((origin) => origin.trim()).filter(Boolean);
if (!configuredOrigins.length) {
  console.error('CLIENT_URL must contain at least one approved origin.');
  process.exit(1);
}
const allowedClientOrigins = [];
for (const origin of configuredOrigins) {
  try {
    const parsed = new URL(origin);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      allowedClientOrigins.push(parsed.origin);
    }
  } catch {
    // Production validation below reports invalid values clearly.
  }
}
if (process.env.NODE_ENV === 'production') {
  if (process.env.JWT_SECRET.trim().length < 32) {
    console.error('JWT_SECRET must contain at least 32 characters in production.');
    process.exit(1);
  }
  const invalidOrigin = configuredOrigins.find((origin) => {
    try {
      const parsed = new URL(origin);
      return parsed.protocol !== 'https:' || parsed.pathname !== '/' || parsed.search || parsed.hash;
    } catch { return true; }
  });
  if (invalidOrigin) {
    console.error('CLIENT_URL must contain only valid HTTPS origins in production.');
    process.exit(1);
  }
}

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const consultationRoutes = require('./routes/consultationRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// ── Security headers ───────────────────────────────────────────
app.use(helmet({
  // Disable CSP in development because Vite injects inline scripts.
  // Re-enable and configure properly for production.
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
}));

// ── CORS ───────────────────────────────────────────────────────
app.use(cors({
  origin: allowedClientOrigins,
  credentials: true,
}));

// ── Body parsing with size limit ───────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Root endpoint status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    phase: 'operational',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/prescriptions', prescriptionRoutes);

// Serve client static build files in production for single-origin deployment
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Error handling
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
app.use(notFound);
app.use(errorHandler);

// Connect to database, then start server
let httpServer;
let missedJob;
let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}; shutting down CureLink.`);
  if (missedJob) await missedJob.stop();
  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve));
  }
  const mongoose = require('mongoose');
  await mongoose.disconnect();
}

process.once('SIGINT', () => shutdown('SIGINT').then(() => process.exit(0)).catch((err) => {
  console.error('Shutdown failed:', err.message); process.exit(1);
}));
process.once('SIGTERM', () => shutdown('SIGTERM').then(() => process.exit(0)).catch((err) => {
  console.error('Shutdown failed:', err.message); process.exit(1);
}));

connectDB().then(() => {
  // Start background job: mark stale "scheduled" appointments as "missed"
  const { startMissedAppointmentJob } = require('./services/missedAppointmentJob');
  missedJob = startMissedAppointmentJob();

  httpServer = app.listen(PORT, () => {
    console.log(`CureLink server running on port ${PORT}`);
  });
}).catch((error) => {
  console.error(`CureLink startup failed: ${error.message}`);
  process.exit(1);
});
