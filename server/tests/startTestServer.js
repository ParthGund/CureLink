const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const TEST_DB_URI = process.env.TEST_MONGO_URI;
if (!TEST_DB_URI || !TEST_DB_URI.includes('curelink_test')) {
  console.error('Safety check failed: TEST_MONGO_URI must point to curelink_test!');
  process.exit(1);
}

// Override connection settings for the test server instance
process.env.MONGO_URI = TEST_DB_URI;
process.env.PORT = '5001';
process.env.CLIENT_URL = 'http://localhost:5001,http://localhost:5173';
process.env.NODE_ENV = 'development';

const connectDB = require('../config/db');
const app = require('../server');

connectDB(TEST_DB_URI).then(() => {
  app.listen(5001, () => {
    console.log('CureLink Test E2E Server running on port 5001 with test DB');
  });
}).catch((err) => {
  console.error('Failed to start test server:', err);
  process.exit(1);
});
