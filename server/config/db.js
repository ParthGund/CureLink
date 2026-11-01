const mongoose = require('mongoose');

// Connection lifecycle event listeners (NFR-04: Reliability)
mongoose.connection.on('error', (err) => {
  console.error(`MongoDB connection error: ${err.message}`);
});
mongoose.connection.on('disconnected', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.warn('MongoDB disconnected. Waiting for reconnection...');
  }
});
mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected successfully.');
});

/**
 * Connect to MongoDB using MONGO_URI or custom URI.
 * Rejects on initial failure so startup can report it and exit cleanly.
 *
 * @param {string} [customUri] - Optional connection URI (e.g. for testing)
 */
const connectDB = async (customUri) => {
  const uri = customUri || process.env.MONGO_URI;
  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
