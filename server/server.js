// CureLink Server
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Startup environment variable validation
['MONGO_URI', 'JWT_SECRET', 'CLIENT_URL'].forEach(k => {
  if (!process.env[k]) {
    console.error(`Missing required environment variable: ${k}`);
    process.exit(1);
  }
});

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

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
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ── Body parsing with size limit ───────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// ── Rate limiting for auth endpoints moved to authRoutes ───────────

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
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`CureLink server running on port ${PORT}`);
  });
});
