const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const doctorService = require("../services/doctorService");
const { sendError } = require("../utils/httpError");

const getDoctors = async (req, res) => {
  try {
    const { search, specialization } = req.query;
    const doctors = await doctorService.listDoctors({ search, specialization });

    res.status(200).json({
      success: true,
      doctors,
    });
  } catch (error) {
    sendError(res, error, "Failed to fetch doctors.");
  }
};

const getDoctorById = async (req, res) => {
  try {
    const doctor = await doctorService.getPublicDoctorById(req.params.id);

    res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    sendError(res, error, "Failed to fetch doctor.");
  }
};


const getMyProfile = async (req, res) => {
  try {
    const doctor = await doctorService.getDoctorForUser(req.user._id);

    res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    sendError(res, error, "Failed to fetch your profile.");
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const doctor = await doctorService.updateOwnProfile(
      req.user._id,
      req.body
    );

    res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    sendError(res, error, "Failed to update your profile.");
  }
};


const getMyPatients = async (req, res) => {
  try {
    const patients = await doctorService.getDoctorPatients(req.user._id);

    res.status(200).json({
      success: true,
      patients,
    });
  } catch (error) {
    sendError(res, error, "Failed to fetch patients.");
  }
};

const getMyPatientById = async (req, res) => {
  try {
    const patient = await doctorService.getDoctorPatientById(
      req.user._id,
      req.params.patientId
    );

    res.status(200).json({
      success: true,
      patient,
    });
  } catch (error) {
    sendError(res, error, "Failed to fetch patient details.");
  }
};

const getDashboard = async (req, res) => {
  try {
    const { date } = req.query; // optional date override for "today"
    const data = await doctorService.getDashboardMetrics(req.user._id, date);
    res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    sendError(res, error, "Failed to fetch dashboard metrics.");
  }
};

module.exports = {
  getDoctors,
  getDoctorById,
  getMyProfile,
  updateMyProfile,
  getMyPatients,
  getMyPatientById,
  getDashboard,
};