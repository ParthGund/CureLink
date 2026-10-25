const mongoose = require('mongoose');
const Prescription = require('../models/Prescription');
const Consultation = require('../models/Consultation');
const doctorService = require('./doctorService');
const appointmentService = require('./appointmentService');
const { httpError } = require('../utils/httpError');

/**
 * Whitelisted fields copied from each item in the request body.
 * Prevents mass assignment of unexpected properties.
 */
const ITEM_WHITELIST = [
  'medicine',
  'dosage',
  'frequency',
  'duration',
  'durationDays',
  'instructions',
];

/**
 * Pick only whitelisted keys from a raw item object.
 *
 * @param {object} raw - Unfiltered item from the request body.
 * @returns {object} Sanitised item.
 */
function sanitiseItem(raw) {
  const clean = {};
  for (const key of ITEM_WHITELIST) {
    if (raw[key] !== undefined) {
      clean[key] = raw[key];
    }
  }
  return clean;
}

/**
 * Population options reused across queries.
 */
const POPULATE_PATIENT = { path: 'patient', select: 'fullName' };
const POPULATE_DOCTOR = { path: 'doctor', select: 'name specialization' };
const POPULATE_CONSULTATION = { path: 'consultation', select: 'status completedAt patient doctor' };

/**
 * True when the error means the server cannot run transactions
 * (standalone MongoDB without a replica set).
 *
 * @param {Error} error
 * @returns {boolean}
 */
function isTransactionUnsupported(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('replica set') || message.includes('transaction numbers are only allowed');
}

let warnedAboutFallback = false;

function warnAboutFallbackOnce() {
  if (warnedAboutFallback) return;
  warnedAboutFallback = true;
  console.warn('[prescriptions] Transactions are not supported by this MongoDB deployment; saving without a transaction.');
}

/**
 * Save (or delete) the prescription for an in-progress consultation.
 *
 * The consultation is written first, which also guards against concurrent
 * finalization. Pass a `session` to run inside a transaction; omit it for the
 * standalone fallback.
 *
 * @param {object} args
 * @param {string} args.consultationId
 * @param {object} args.doctor - Doctor document of the signed-in doctor.
 * @param {object[]} args.items - Validated prescription items.
 * @param {object} [args.session] - Optional Mongoose session.
 * @returns {Promise<object|null>} The saved prescription, or null when deleted.
 */
async function writePrescription({ consultationId, doctor, items, session }) {
  const options = session ? { session } : {};

  const editableConsultation = await Consultation.findOneAndUpdate(
    { _id: consultationId, doctor: doctor._id, status: 'in_progress' },
    { $set: { updatedAt: new Date() } },
    { new: true, ...options }
  );
  if (!editableConsultation) {
    throw httpError(400, 'This consultation is no longer available for prescription changes.');
  }

  if (items.length === 0) {
    await Prescription.deleteOne({ consultation: consultationId }, options);
    return null;
  }

  return Prescription.findOneAndUpdate(
    { consultation: consultationId },
    {
      consultation: consultationId,
      patient: editableConsultation.patient,
      doctor: doctor._id,
      items: items.map(sanitiseItem),
    },
    { upsert: true, new: true, runValidators: true, ...options }
  );
}

/**
 * Create or replace prescription items for a consultation.
 *
 * Patient and doctor are always copied from the consultation.
 * If `items` is an empty array the prescription is deleted.
 *
 * @param {object} user - req.user (authenticated User document).
 * @param {string} consultationId - Consultation._id.
 * @param {object[]} items - Array of item objects (already validated).
 * @returns {Promise<{ prescription: object|null }>}
 */
async function upsertPrescription(user, consultationId, items) {
  const doctor = await doctorService.getDoctorForUser(user._id);
  if (!doctor) {
    throw httpError(404, 'Your doctor profile has not been set up yet. Please contact an administrator.');
  }

  const consultation = await Consultation.findById(consultationId);
  if (!consultation) {
    throw httpError(404, 'Consultation not found.');
  }

  if (!consultation.doctor.equals(doctor._id)) {
    throw httpError(403, 'You can only manage prescriptions for your own consultations.');
  }

  if (consultation.status === 'completed') {
    throw httpError(400, 'Prescriptions cannot be modified after the consultation is completed.');
  }

  if (consultation.status !== 'in_progress') {
    throw httpError(400, 'Prescriptions can only be managed for in-progress consultations.');
  }

  const write = { consultationId, doctor, items };

  let prescription;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    prescription = await writePrescription({ ...write, session });
    await session.commitTransaction();
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction().catch(() => {});
    }
    if (!isTransactionUnsupported(error)) throw error;

    // Standalone MongoDB (no replica set): repeat the same writes without a
    // transaction. Same behaviour as completeConsultation's fallback; the
    // writes are not atomic, so use a replica set where that matters.
    warnAboutFallbackOnce();
    prescription = await writePrescription(write);
  } finally {
    await session.endSession();
  }

  if (!prescription) {
    return { prescription: null };
  }

  const populated = await Prescription.findById(prescription._id)
    .populate(POPULATE_PATIENT)
    .populate(POPULATE_DOCTOR)
    .populate(POPULATE_CONSULTATION);

  return { prescription: populated };
}

/**
 * Get the prescription for a consultation with role-based access.
 *
 * - Doctor: must own the consultation.
 * - Patient: must own the consultation AND the consultation must be completed.
 *
 * @param {object} user - req.user.
 * @param {string} consultationId - Consultation._id.
 * @returns {Promise<{ prescription: object|null }>}
 */
async function getPrescriptionByConsultation(user, consultationId) {
  const consultation = await Consultation.findById(consultationId);
  if (!consultation) {
    throw httpError(404, 'Consultation not found.');
  }

  if (user.role === 'doctor') {
    const doctor = await doctorService.getDoctorForUser(user._id);
    if (!doctor || !consultation.doctor.equals(doctor._id)) {
      throw httpError(403, 'You do not have access to this prescription.');
    }
  } else if (user.role === 'patient') {
    const patient = await appointmentService.getPatientForUser(user._id);
    if (!patient || !consultation.patient.equals(patient._id)) {
      throw httpError(403, 'You do not have access to this prescription.');
    }
    if (consultation.status !== 'completed') {
      throw httpError(403, 'Prescription is not available until the consultation is completed.');
    }
  } else {
    throw httpError(403, 'You do not have access to this prescription.');
  }

  const prescription = await Prescription.findOne({
    consultation: consultationId,
    patient: consultation.patient,
    doctor: consultation.doctor,
  })
    .populate(POPULATE_PATIENT)
    .populate(POPULATE_DOCTOR)
    .populate(POPULATE_CONSULTATION);

  if (!prescription) {
    return { prescription: null };
  }

  const shaped = shapePrescription(prescription, user.role);
  return { prescription: shaped };
}

/**
 * List prescriptions issued by the authenticated doctor, newest first.
 *
 * @param {object} user - req.user.
 * @returns {Promise<object[]>}
 */
async function getDoctorPrescriptions(user) {
  const doctor = await doctorService.getDoctorForUser(user._id);
  if (!doctor) {
    throw httpError(404, 'Your doctor profile has not been set up yet. Please contact an administrator.');
  }

  return Prescription.find({ doctor: doctor._id })
    .populate(POPULATE_PATIENT)
    .populate(POPULATE_DOCTOR)
    .populate(POPULATE_CONSULTATION)
    .sort({ createdAt: -1 });
}

/**
 * List prescriptions for the authenticated patient, only from completed
 * consultations, newest first. Adds `prescribedOn`, per-item `endsOn`
 * and `isActive` fields.
 *
 * @param {object} user - req.user.
 * @returns {Promise<object[]>}
 */
async function getPatientPrescriptions(user) {
  const patient = await appointmentService.getPatientForUser(user._id);
  if (!patient) {
    return [];
  }

  const prescriptions = await Prescription.find({ patient: patient._id })
    .populate(POPULATE_PATIENT)
    .populate(POPULATE_DOCTOR)
    .populate(POPULATE_CONSULTATION)
    .sort({ createdAt: -1 });

  // Only include prescriptions whose consultation is completed
  const completed = prescriptions.filter((rx) =>
    rx.consultation &&
    rx.consultation.status === 'completed' &&
    rx.consultation.patient && rx.consultation.patient.equals(patient._id) &&
    rx.consultation.doctor && rx.doctor &&
    rx.consultation.doctor.equals(rx.doctor._id || rx.doctor)
  );

  return completed.map((rx) => shapePrescription(rx, 'patient'));
}

/**
 * Get the patient's currently active medicine items.
 *
 * An item is active only when `durationDays` is set and `now` is before
 * the end of the day `prescribedOn + durationDays` days from prescribedOn.
 * Items without `durationDays` are never active.
 *
 * @param {object} user - req.user.
 * @returns {Promise<object[]>} Flat list of active items, sorted by endsOn ascending.
 */
async function getPatientActiveMedicines(user) {
  const patient = await appointmentService.getPatientForUser(user._id);
  if (!patient) {
    return [];
  }

  const prescriptions = await Prescription.find({ patient: patient._id })
    .populate(POPULATE_DOCTOR)
    .populate(POPULATE_CONSULTATION);

  const now = new Date();
  const activeMedicines = [];

  for (const rx of prescriptions) {
    if (
      !rx.consultation || rx.consultation.status !== 'completed' ||
      !rx.consultation.patient || !rx.consultation.patient.equals(patient._id) ||
      !rx.consultation.doctor || !rx.doctor ||
      !rx.consultation.doctor.equals(rx.doctor._id || rx.doctor)
    ) {
      continue;
    }

    const prescribedOn = rx.consultation.completedAt;
    if (!prescribedOn) {
      continue;
    }

    for (const item of rx.items) {
      if (!item.durationDays) {
        continue;
      }

      const endsOn = computeEndsOn(prescribedOn, item.durationDays);
      if (now < endsOn) {
        activeMedicines.push({
          medicine: item.medicine,
          dosage: item.dosage || undefined,
          frequency: item.frequency || undefined,
          duration: item.duration || undefined,
          durationDays: item.durationDays,
          instructions: item.instructions || undefined,
          prescribedOn,
          endsOn,
          doctor: rx.doctor
            ? { name: rx.doctor.name, specialization: rx.doctor.specialization }
            : null,
        });
      }
    }
  }

  // Sort by endsOn ascending
  activeMedicines.sort((a, b) => a.endsOn - b.endsOn);

  return activeMedicines;
}

/**
 * Compute the end-of-day date for a prescription item.
 *
 * @param {Date} prescribedOn - The date the consultation was completed.
 * @param {number} durationDays - Number of days the medicine is prescribed for.
 * @returns {Date} End of the last day of the prescription.
 */
function computeEndsOn(prescribedOn, durationDays) {
  const end = new Date(prescribedOn);
  end.setDate(end.getDate() + durationDays);
  // End of that day (23:59:59.999)
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Shape a prescription document for patient responses.
 *
 * Adds `prescribedOn`, per-item `endsOn` and `isActive`.
 * Strips consultation fields down to `status` and `completedAt`.
 *
 * @param {object} prescription - Populated prescription document.
 * @param {string} role - 'doctor' or 'patient'.
 * @returns {object} Shaped prescription object.
 */
function shapePrescription(prescription, role) {
  const obj = prescription.toObject ? prescription.toObject() : { ...prescription };

  if (role === 'patient') {
    const prescribedOn = obj.consultation ? obj.consultation.completedAt : null;
    obj.prescribedOn = prescribedOn;

    if (prescribedOn) {
      const now = new Date();
      obj.items = obj.items.map((item) => {
        const shaped = { ...item };
        if (item.durationDays) {
          shaped.endsOn = computeEndsOn(prescribedOn, item.durationDays);
          shaped.isActive = now < shaped.endsOn;
        } else {
          shaped.endsOn = null;
          shaped.isActive = false;
        }
        return shaped;
      });
    }
  }

  return obj;
}

module.exports = {
  upsertPrescription,
  getPrescriptionByConsultation,
  getDoctorPrescriptions,
  getPatientPrescriptions,
  getPatientActiveMedicines,
};
