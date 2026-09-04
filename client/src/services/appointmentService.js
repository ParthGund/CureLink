import api from "./api";

export const getDoctors = async () => {
  const { data } = await api.get("/doctors");
  return data;
};

export const getAvailableSlots = async (doctorId, date) => {
  // date must be YYYY-MM-DD
  const { data } = await api.get(`/doctors/${doctorId}/slots`, { params: { date } });
  return data.slots;
};

export const bookAppointment = async (payload) => {
  const { data } = await api.post("/appointments", payload);
  return data;
};

export const getPatientAppointments = async (patientId) => {
  const { data } = await api.get(`/appointments/patient/${patientId}`);
  return data; // { upcoming: [], past: [] }
};

export const cancelAppointment = async (id) => {
  const { data } = await api.put(`/appointments/${id}/cancel`);
  return data;
};