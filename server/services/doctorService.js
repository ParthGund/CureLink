const mongoose = require("mongoose");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const { httpError } = require("../utils/httpError");

// Fields returned on public endpoints (listing, by-id).
const PUBLIC_FIELDS = "_id name specialization experience qualifications bio languages";

// Fields returned on own-profile endpoints (/me).
const OWN_PROFILE_FIELDS = PUBLIC_FIELDS + " email";

/**
 * Escape regex special characters in a string so it can be used
 * safely inside a RegExp constructor with user input.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * List doctors with optional search and specialization filter.
 *
 * @param {object} options
 * @param {string} [options.search] - Substring match on name OR specialization.
 * @param {string} [options.specialization] - Exact match on specialization (case-insensitive).
 * @returns {Promise<object[]>} Array of public doctor objects.
 */
async function listDoctors({ search, specialization } = {}) {
  const filter = {};

  if (search) {
    const escaped = escapeRegex(search.trim());
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { specialization: { $regex: escaped, $options: "i" } },
    ];
  }

  if (specialization) {
    filter.specialization = { $regex: `^${escapeRegex(specialization.trim())}$`, $options: "i" };
  }

  return Doctor.find(filter)
    .select(PUBLIC_FIELDS)
    .sort({ name: 1 })
    .collation({ locale: "en", strength: 2 });
}

/**
 * Get a single doctor's public profile by document id.
 *
 * @param {string} id - Doctor document _id.
 * @returns {Promise<object>} Public doctor object.
 * @throws {Error} 404 if not found or invalid id.
 */
async function getPublicDoctorById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw httpError(404, "Doctor not found.");
  }

  const doctor = await Doctor.findById(id).select(PUBLIC_FIELDS);

  if (!doctor) {
    throw httpError(404, "Doctor not found.");
  }

  return doctor;
}

/**
 * Get the Doctor profile linked to a User id (own-profile shape).
 *
 * @param {string} userId - User document _id.
 * @returns {Promise<object>} Own-profile doctor object.
 * @throws {Error} 404 if the user has no linked Doctor profile.
 */
async function getDoctorForUser(userId) {
  let doctor = await Doctor.findOne({ user: userId }).select(OWN_PROFILE_FIELDS);

  if (!doctor) {
    const user = await User.findById(userId).select("email");
    if (user && user.email) {
      doctor = await Doctor.findOne({ 
        email: user.email.toLowerCase(), 
        user: null 
      }).select(OWN_PROFILE_FIELDS);

      if (doctor) {
        doctor.user = userId;
        await doctor.save();
      }
    }
  }

  if (!doctor) {
    throw httpError(
      404,
      "Your doctor profile has not been set up yet. Please contact an administrator."
    );
  }

  return doctor;
}

/**
 * Update the editable fields of a doctor's own profile.
 *
 * Whitelisted fields: experience, qualifications, bio, languages.
 * All other fields (name, specialization, email, user, etc.) are ignored.
 *
 * @param {string} userId - User document _id.
 * @param {object} input - Request body with fields to update.
 * @returns {Promise<object>} Updated own-profile doctor object.
 * @throws {Error} 404 if no linked Doctor; 400 if validation fails.
 */
async function updateOwnProfile(userId, input) {
  const doctor = await Doctor.findOne({ user: userId });

  if (!doctor) {
    throw httpError(
      404,
      "Your doctor profile has not been set up yet. Please contact an administrator."
    );
  }

  // Whitelist editable fields
  if (input.experience !== undefined) {
    doctor.experience = input.experience;
  }
  if (input.qualifications !== undefined) {
    doctor.qualifications = input.qualifications;
  }
  if (input.bio !== undefined) {
    doctor.bio = input.bio;
  }
  if (input.languages !== undefined) {
    if (!Array.isArray(input.languages)) {
      throw httpError(400, "Languages must be an array.");
    }

    // Filter out empty strings after trimming
    const cleaned = input.languages
      .map((lang) => (typeof lang === "string" ? lang.trim() : ""))
      .filter((lang) => lang.length > 0);

    doctor.languages = cleaned;
  }

  try {
    await doctor.save();
  } catch (err) {
    // Surface Mongoose validation errors as 400 with the first message
    if (err.name === "ValidationError") {
      const firstMessage = Object.values(err.errors)[0].message;
      throw httpError(400, firstMessage);
    }
    throw err;
  }

  // Re-select to return only own-profile fields
  return Doctor.findById(doctor._id).select(OWN_PROFILE_FIELDS);
}

module.exports = {
  listDoctors,
  getPublicDoctorById,
  getDoctorForUser,
  updateOwnProfile,
};
