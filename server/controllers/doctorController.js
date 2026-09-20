const Doctor = require("../models/Doctor");
const doctorService = require("../services/doctorService");
const { sendError } = require("../utils/httpError");

const getDoctors = async (req, res) => {
  try {
    const { search, specialization } = req.query;
    const doctors = await doctorService.listDoctors({ search, specialization });
    res.status(200).json({ success: true, doctors });
  } catch (error) {
    sendError(res, error, "Failed to fetch doctors.");
  }
};

const getDoctorById = async (req, res) => {
  try {
    const doctor = await doctorService.getPublicDoctorById(req.params.id);
    res.status(200).json({ success: true, doctor });
  } catch (error) {
    sendError(res, error, "Failed to fetch doctor.");
  }
};

const createDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.create(req.body);
    res.status(201).json({ success: true, doctor });
  } catch (error) {
    sendError(res, error, "Failed to create doctor.");
  }
};

const getMyProfile = async (req, res) => {
  try {
    const doctor = await doctorService.getDoctorForUser(req.user._id);
    res.status(200).json({ success: true, doctor });
  } catch (error) {
    sendError(res, error, "Failed to fetch your profile.");
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const doctor = await doctorService.updateOwnProfile(req.user._id, req.body);
    res.status(200).json({ success: true, doctor });
  } catch (error) {
    sendError(res, error, "Failed to update your profile.");
  }
};

module.exports = { getDoctors, getDoctorById, createDoctor, getMyProfile, updateMyProfile };
