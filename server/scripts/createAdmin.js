/**
 * Bootstrap an admin account for CureLink.
 *
 * Usage:  node scripts/createAdmin.js
 *
 * This is a server-side utility. It is NOT callable from the frontend
 * and must NOT be exposed through an HTTP endpoint.
 *
 * Requirements:
 *   - MONGO_URI (or MONGODB_URI) must be set in .env
 *   - Prompts for name, email, and password interactively
 *   - Refuses to create an admin if one already exists
 *     (override with --force flag if absolutely necessary)
 *   - Lets the User model's pre-save hook handle password hashing
 *   - Never logs the password
 */

const path = require('path');
const readline = require('readline');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');

const FORCE_FLAG = process.argv.includes('--force');

/**
 * Prompt the user for input in the terminal.
 */
function prompt(rl, question, hidden = false) {
  return new Promise((resolve) => {
    if (hidden) {
      // For password input, hide characters
      process.stdout.write(question);
      const stdin = process.stdin;
      const wasRaw = stdin.isRaw;

      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding('utf8');

      let input = '';
      const onData = (char) => {
        switch (char) {
          case '\n':
          case '\r':
          case '\u0004': // Ctrl+D
            stdin.setRawMode(wasRaw);
            stdin.pause();
            stdin.removeListener('data', onData);
            process.stdout.write('\n');
            resolve(input);
            break;
          case '\u0003': // Ctrl+C
            process.exit(1);
            break;
          case '\u007F': // Backspace
            if (input.length > 0) {
              input = input.slice(0, -1);
              process.stdout.clearLine(0);
              process.stdout.cursorTo(0);
              process.stdout.write(question + '*'.repeat(input.length));
            }
            break;
          default:
            input += char;
            process.stdout.write('*');
            break;
        }
      };

      stdin.on('data', onData);
    } else {
      rl.question(question, resolve);
    }
  });
}

async function createAdmin() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!uri) {
    console.error('Error: No MongoDB connection string found.');
    console.error('Set MONGO_URI or MONGODB_URI in your .env file.');
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB\n');

    // Check if an admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });

    if (existingAdmin && !FORCE_FLAG) {
      console.error('An admin account already exists.');
      console.error('If you need to create another admin, run with --force flag.');
      console.error('  node scripts/createAdmin.js --force');
      process.exit(1);
    }

    if (existingAdmin && FORCE_FLAG) {
      console.log('Warning: An admin already exists. Creating another one due to --force flag.\n');
    }

    // Prompt for credentials
    const name = await prompt(rl, 'Admin name: ');
    if (!name || name.trim().length === 0) {
      console.error('Error: Name is required.');
      process.exit(1);
    }

    const email = await prompt(rl, 'Admin email: ');
    if (!email || email.trim().length === 0) {
      console.error('Error: Email is required.');
      process.exit(1);
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check for duplicate email
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      console.error(`Error: A user with email "${trimmedEmail}" already exists.`);
      process.exit(1);
    }

    rl.close();

    const password = await prompt(null, 'Admin password: ', true);
    if (!password || password.length < 8) {
      console.error('Error: Password must be at least 8 characters.');
      process.exit(1);
    }

    const confirmPassword = await prompt(null, 'Confirm password: ', true);
    if (password !== confirmPassword) {
      console.error('Error: Passwords do not match.');
      process.exit(1);
    }

    // Create the admin user.
    // The User model's pre-save hook handles password hashing.
    const admin = await User.create({
      name: name.trim(),
      email: trimmedEmail,
      password,
      role: 'admin',
    });

    console.log('\nAdmin account created successfully.');
    console.log(`  Name:  ${admin.name}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Role:  ${admin.role}`);
    console.log(`  ID:    ${admin._id}`);
    console.log('\nYou can now log in at the CureLink application.');
  } catch (error) {
    console.error('Script failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

createAdmin();
