// CureLink Express Application
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Root endpoint status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    phase: 'Phase 2 - Backend Foundation',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);

// Placeholder routes (to be replaced with real route modules)
app.use('/api/appointments', (req, res) => res.status(501).json({ message: 'Appointment endpoints not yet implemented.' }));
app.use('/api/doctors', (req, res) => res.status(501).json({ message: 'Doctor endpoints not yet implemented.' }));
app.use('/api/records', (req, res) => res.status(501).json({ message: 'Record endpoints not yet implemented.' }));

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
