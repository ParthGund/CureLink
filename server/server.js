// CureLink Server
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const consultationRoutes = require('./routes/consultationRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');

const app = express();
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
    phase: 'Phase 4 - Core Features',
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
