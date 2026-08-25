// CureLink Server Skeleton (Phase 1)
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    phase: 'Phase 1 - Frontend Skeleton',
    timestamp: new Date().toISOString()
  });
});

// Serve empty endpoints for later implementation
app.use('/api/auth', (req, res) => res.status(501).json({ message: 'Auth endpoints not implemented in Phase 1.' }));
app.use('/api/appointments', (req, res) => res.status(501).json({ message: 'Appointment endpoints not implemented in Phase 1.' }));
app.use('/api/doctors', (req, res) => res.status(501).json({ message: 'Doctor endpoints not implemented in Phase 1.' }));
app.use('/api/records', (req, res) => res.status(501).json({ message: 'Record endpoints not implemented in Phase 1.' }));

app.listen(PORT, () => {
  console.log(`CureLink backend skeleton listening on port ${PORT}`);
});
