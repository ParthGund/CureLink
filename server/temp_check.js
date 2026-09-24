const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const Patient = require('./models/Patient');
  const dups = await Patient.aggregate([
    { $group: { _id: '$userId', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 }, _id: { $ne: null } } }
  ]);
  console.log('Duplicates:', JSON.stringify(dups));
  process.exit(0);
}
check();
