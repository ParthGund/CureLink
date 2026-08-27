const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the connection string from environment variables.
 * Exits the process if the connection fails, since the backend
 * cannot operate without its database.
 */
const connectDatabase = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDatabase;
