var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/services/api.js
async function api(endpoint, options = {}) {
  const config = {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options
  };
  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || "Something went wrong.");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}
var API_BASE_URL, api_default;
var init_api = __esm({
  "src/services/api.js"() {
    API_BASE_URL = "http://localhost:5000/api";
    api_default = api;
  }
});

// src/services/doctorService.js
var doctorService_exports = {};
__export(doctorService_exports, {
  cancelMyDay: () => cancelMyDay,
  createMySlots: () => createMySlots,
  deleteMySlot: () => deleteMySlot,
  generateSlotsFromWorkingHours: () => generateSlotsFromWorkingHours,
  getDoctorAvailability: () => getDoctorAvailability,
  getDoctorById: () => getDoctorById,
  getDoctors: () => getDoctors,
  getMyProfile: () => getMyProfile,
  getMySchedule: () => getMySchedule,
  getMySlots: () => getMySlots,
  updateMyProfile: () => updateMyProfile,
  updateMySchedule: () => updateMySchedule,
  updateMySlot: () => updateMySlot
});
async function getDoctors() {
  const data = await api_default("/doctors");
  return data.doctors;
}
async function getDoctorById(id) {
  const data = await api_default(`/doctors/${id}`);
  return data.doctor;
}
async function getDoctorAvailability(id, { from, to } = {}) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString() ? `?${params.toString()}` : "";
  const data = await api_default(`/doctors/${id}/availability${query}`);
  return data.availability;
}
async function getMyProfile() {
  const data = await api_default("/doctors/me");
  return data.doctor;
}
async function updateMyProfile(payload) {
  const data = await api_default("/doctors/me", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
  return data.doctor;
}
async function getMySlots({ from, to } = {}) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString() ? `?${params.toString()}` : "";
  const data = await api_default(`/doctors/me/slots${query}`);
  return data.slots;
}
async function createMySlots(payload) {
  const data = await api_default("/doctors/me/slots", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return data.slots;
}
async function updateMySlot(id, changes) {
  const data = await api_default(`/doctors/me/slots/${id}`, { method: "PUT", body: changes });
  return data;
}
async function deleteMySlot(id) {
  await api_default(`/doctors/me/slots/${id}`, { method: "DELETE" });
}
async function generateSlotsFromWorkingHours() {
  const data = await api_default("/doctors/me/slots/from-working-hours", { method: "POST" });
  return { created: data.created, skipped: data.skipped, message: data.message };
}
async function getMySchedule() {
  const data = await api_default("/doctors/me/schedule");
  return data.schedule;
}
async function updateMySchedule(payload) {
  const data = await api_default("/doctors/me/schedule", { method: "PUT", body: payload });
  return { schedule: data.schedule, message: data.message };
}
async function cancelMyDay(date) {
  const data = await api_default("/doctors/me/slots/cancel-day", { method: "POST", body: { date } });
  return { cancelled: data.cancelled, keptBooked: data.keptBooked, message: data.message };
}
var init_doctorService = __esm({
  "src/services/doctorService.js"() {
    init_api();
  }
});

// src/pages/doctor/Schedule.jsx
var Schedule_exports = {};
__export(Schedule_exports, {
  default: () => Schedule
});
module.exports = __toCommonJS(Schedule_exports);
var import_react5 = require("react");
var import_lucide_react4 = require("lucide-react");

// src/components/common/Card.jsx
function Card({ children, className = "" }) {
  return /* @__PURE__ */ React.createElement("section", { className: `card ${className}`.trim() }, children);
}

// src/components/common/EmptyState.jsx
function EmptyState({ icon: Icon, title, description, action }) {
  return /* @__PURE__ */ React.createElement("div", { className: "empty-state" }, Icon && /* @__PURE__ */ React.createElement("span", { className: "empty-state__icon" }, /* @__PURE__ */ React.createElement(Icon, { "aria-hidden": "true", size: 31, strokeWidth: 2.1 })), /* @__PURE__ */ React.createElement("h3", null, title), /* @__PURE__ */ React.createElement("p", null, description), action);
}

// src/components/doctor/AvailabilityForm.jsx
var import_react = require("react");

// src/utils/dateUtils.js
function getTodayIso() {
  const now = /* @__PURE__ */ new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function formatDisplayDate(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
function formatShortDate(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${weekday} ${d} ${month}`;
}

// src/components/doctor/AvailabilityForm.jsx
init_doctorService();
var ALLOWED_DURATIONS = [15, 20, 30, 45, 60];
function computeSlotCount(startTime, endTime, durationMinutes) {
  if (!startTime || !endTime || !durationMinutes) return 0;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  const window2 = endMins - startMins;
  if (window2 <= 0) return 0;
  return Math.floor(window2 / durationMinutes);
}
function AvailabilityForm({ onCreated }) {
  const today = getTodayIso();
  const [date, setDate] = (0, import_react.useState)("");
  const [startTime, setStartTime] = (0, import_react.useState)("");
  const [endTime, setEndTime] = (0, import_react.useState)("");
  const [duration, setDuration] = (0, import_react.useState)(30);
  const [error, setError] = (0, import_react.useState)("");
  const [submitting, setSubmitting] = (0, import_react.useState)(false);
  const slotCount = computeSlotCount(startTime, endTime, duration);
  const canSubmit = date && startTime && endTime && slotCount > 0 && !submitting;
  function resetForm() {
    setDate("");
    setStartTime("");
    setEndTime("");
    setDuration(30);
    setError("");
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await createMySlots({
        date,
        startTime,
        endTime,
        slotDurationMinutes: duration
      });
      resetForm();
      onCreated();
    } catch (err) {
      setError(err.message || "Failed to create slots. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }
  return /* @__PURE__ */ React.createElement("form", { className: "avail-form", onSubmit: handleSubmit, noValidate: true }, error && /* @__PURE__ */ React.createElement("p", { className: "schedule-msg schedule-msg--error", role: "alert" }, error), /* @__PURE__ */ React.createElement("div", { className: "avail-form__field" }, /* @__PURE__ */ React.createElement("label", { className: "avail-form__label", htmlFor: "af-date" }, "Date"), /* @__PURE__ */ React.createElement(
    "input",
    {
      id: "af-date",
      type: "date",
      className: "avail-form__input",
      min: today,
      value: date,
      onChange: (e) => {
        setDate(e.target.value);
        setError("");
      },
      required: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "avail-form__row" }, /* @__PURE__ */ React.createElement("div", { className: "avail-form__field" }, /* @__PURE__ */ React.createElement("label", { className: "avail-form__label", htmlFor: "af-start" }, "Start time"), /* @__PURE__ */ React.createElement(
    "input",
    {
      id: "af-start",
      type: "time",
      className: "avail-form__input",
      value: startTime,
      onChange: (e) => {
        setStartTime(e.target.value);
        setError("");
      },
      required: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "avail-form__field" }, /* @__PURE__ */ React.createElement("label", { className: "avail-form__label", htmlFor: "af-end" }, "End time"), /* @__PURE__ */ React.createElement(
    "input",
    {
      id: "af-end",
      type: "time",
      className: "avail-form__input",
      value: endTime,
      onChange: (e) => {
        setEndTime(e.target.value);
        setError("");
      },
      required: true
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: "avail-form__field" }, /* @__PURE__ */ React.createElement("label", { className: "avail-form__label", htmlFor: "af-duration" }, "Slot length"), /* @__PURE__ */ React.createElement(
    "select",
    {
      id: "af-duration",
      className: "avail-form__input",
      value: duration,
      onChange: (e) => setDuration(Number(e.target.value))
    },
    ALLOWED_DURATIONS.map((d) => /* @__PURE__ */ React.createElement("option", { key: d, value: d }, d, " minutes"))
  )), /* @__PURE__ */ React.createElement("p", { className: "avail-form__preview" }, slotCount > 0 ? `This will create ${slotCount} time ${slotCount === 1 ? "slot" : "slots"}.` : "Enter a date, start time, and end time to see a preview."), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      className: "button",
      disabled: !canSubmit
    },
    submitting ? "Adding\u2026" : "Add slots"
  ));
}

// src/pages/doctor/Schedule.jsx
init_doctorService();

// src/components/doctor/ScheduleSettingsCard.jsx
var import_lucide_react = require("lucide-react");
var DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function ScheduleSettingsCard({ schedule, onEdit }) {
  if (!schedule) return null;
  const { workingDays, workingHours, slotDurationMinutes, breakTime } = schedule;
  if (!workingDays || workingDays.length === 0) {
    return /* @__PURE__ */ React.createElement(Card, { className: "schedule-settings-card" }, /* @__PURE__ */ React.createElement(
      EmptyState,
      {
        icon: import_lucide_react.Calendar,
        title: "No working days set",
        description: "Choose your working days and hours to open times for patients.",
        action: { label: "Edit schedule", onClick: onEdit }
      }
    ));
  }
  const formatTime = (t) => {
    if (!t) return "";
    const [h, m] = t.split(":");
    const d = /* @__PURE__ */ new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };
  const hoursStr = `${formatTime(workingHours.start)} \u2013 ${formatTime(workingHours.end)}`;
  const breakStr = breakTime?.start && breakTime?.end ? `${formatTime(breakTime.start)} \u2013 ${formatTime(breakTime.end)}` : "No break";
  return /* @__PURE__ */ React.createElement(Card, { className: "schedule-settings-card" }, /* @__PURE__ */ React.createElement("div", { className: "schedule-card__header" }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("h2", null, "Working schedule"), /* @__PURE__ */ React.createElement("p", { className: "schedule-card__sub" }, "Your weekly hours. Changing them updates your upcoming open times.")), /* @__PURE__ */ React.createElement("button", { type: "button", className: "button button--secondary", onClick: onEdit }, "Edit schedule")), /* @__PURE__ */ React.createElement("div", { className: "schedule-card__body" }, /* @__PURE__ */ React.createElement("div", { className: "schedule-settings-grid" }, /* @__PURE__ */ React.createElement("div", { className: "schedule-setting-item" }, /* @__PURE__ */ React.createElement("span", { className: "schedule-setting-label" }, /* @__PURE__ */ React.createElement(import_lucide_react.Calendar, { size: 16 }), " Days"), /* @__PURE__ */ React.createElement("div", { className: "schedule-setting-chips" }, DAY_LABELS.map((label, i) => {
    const isActive = workingDays.includes(i);
    return /* @__PURE__ */ React.createElement("span", { key: i, className: `schedule-day-chip ${isActive ? "schedule-day-chip--active" : ""}` }, label);
  }))), /* @__PURE__ */ React.createElement("div", { className: "schedule-setting-item" }, /* @__PURE__ */ React.createElement("span", { className: "schedule-setting-label" }, /* @__PURE__ */ React.createElement(import_lucide_react.Clock, { size: 16 }), " Hours"), /* @__PURE__ */ React.createElement("span", { className: "schedule-setting-value" }, hoursStr)), /* @__PURE__ */ React.createElement("div", { className: "schedule-setting-item" }, /* @__PURE__ */ React.createElement("span", { className: "schedule-setting-label" }, /* @__PURE__ */ React.createElement(import_lucide_react.Hash, { size: 16 }), " Slot length"), /* @__PURE__ */ React.createElement("span", { className: "schedule-setting-value" }, slotDurationMinutes, " minutes")), /* @__PURE__ */ React.createElement("div", { className: "schedule-setting-item" }, /* @__PURE__ */ React.createElement("span", { className: "schedule-setting-label" }, /* @__PURE__ */ React.createElement(import_lucide_react.Coffee, { size: 16 }), " Break"), /* @__PURE__ */ React.createElement("span", { className: "schedule-setting-value" }, breakStr)))));
}

// src/components/doctor/ScheduleSettingsModal.jsx
var import_react2 = require("react");
var import_lucide_react2 = require("lucide-react");
var DAY_LABELS2 = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" }
];
var STANDARD_DURATIONS = [15, 20, 30, 45, 60];
function ScheduleSettingsModal({ schedule, onClose, onSave }) {
  const [form, setForm] = (0, import_react2.useState)({
    workingDays: schedule?.workingDays || [],
    start: schedule?.workingHours?.start || "09:00",
    end: schedule?.workingHours?.end || "17:00",
    duration: schedule?.slotDurationMinutes || 30,
    breakStart: schedule?.breakTime?.start || "",
    breakEnd: schedule?.breakTime?.end || ""
  });
  const [error, setError] = (0, import_react2.useState)("");
  const [saving, setSaving] = (0, import_react2.useState)(false);
  const durationOptions = [.../* @__PURE__ */ new Set([...STANDARD_DURATIONS, form.duration])].sort((a, b) => a - b);
  const toggleDay = (dayValue) => {
    setForm((prev) => {
      const days = prev.workingDays.includes(dayValue) ? prev.workingDays.filter((d) => d !== dayValue) : [...prev.workingDays, dayValue];
      return { ...prev, workingDays: days };
    });
  };
  const toMins = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.workingDays.length === 0) {
      return setError("Select at least one working day.");
    }
    if (toMins(form.end) <= toMins(form.start)) {
      return setError("End time must be after start time.");
    }
    if (form.breakStart || form.breakEnd) {
      if (!form.breakStart || !form.breakEnd || toMins(form.breakEnd) <= toMins(form.breakStart)) {
        return setError("Your break must fall within your working hours.");
      }
      if (toMins(form.breakStart) < toMins(form.start) || toMins(form.breakEnd) > toMins(form.end)) {
        return setError("Your break must fall within your working hours.");
      }
    }
    setSaving(true);
    try {
      await onSave({
        workingDays: form.workingDays,
        workingHours: { start: form.start, end: form.end },
        slotDurationMinutes: Number(form.duration),
        breakTime: { start: form.breakStart, end: form.breakEnd }
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save schedule settings.");
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "modal-overlay", onClick: onClose, role: "dialog", "aria-modal": "true", "aria-labelledby": "settings-modal-title" }, /* @__PURE__ */ React.createElement("div", { className: "modal-panel", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-header" }, /* @__PURE__ */ React.createElement("h2", { id: "settings-modal-title" }, "Edit schedule"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "modal-close", onClick: onClose, "aria-label": "Close" }, /* @__PURE__ */ React.createElement(import_lucide_react2.X, { size: 20 }))), /* @__PURE__ */ React.createElement("form", { className: "modal-form", onSubmit: handleSubmit }, error && /* @__PURE__ */ React.createElement("p", { className: "modal-error", role: "alert" }, error), /* @__PURE__ */ React.createElement("fieldset", { className: "modal-fieldset" }, /* @__PURE__ */ React.createElement("legend", { className: "modal-label" }, "Available Days ", /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "*")), /* @__PURE__ */ React.createElement("div", { className: "modal-days" }, DAY_LABELS2.map(({ value, label }) => /* @__PURE__ */ React.createElement(
    "label",
    {
      key: value,
      className: `modal-day-chip ${form.workingDays.includes(value) ? "modal-day-chip--active" : ""}`
    },
    /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "checkbox",
        className: "sr-only",
        checked: form.workingDays.includes(value),
        onChange: () => toggleDay(value)
      }
    ),
    label
  )))), /* @__PURE__ */ React.createElement("div", { className: "modal-row" }, /* @__PURE__ */ React.createElement("label", { className: "modal-field" }, /* @__PURE__ */ React.createElement("span", { className: "modal-label" }, "Start Time ", /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "time",
      className: "modal-input",
      value: form.start,
      onChange: (e) => setForm({ ...form, start: e.target.value }),
      required: true
    }
  )), /* @__PURE__ */ React.createElement("label", { className: "modal-field" }, /* @__PURE__ */ React.createElement("span", { className: "modal-label" }, "End Time ", /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "time",
      className: "modal-input",
      value: form.end,
      onChange: (e) => setForm({ ...form, end: e.target.value }),
      required: true
    }
  ))), /* @__PURE__ */ React.createElement("label", { className: "modal-field" }, /* @__PURE__ */ React.createElement("span", { className: "modal-label" }, "Slot Duration ", /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "*")), /* @__PURE__ */ React.createElement(
    "select",
    {
      className: "modal-input",
      value: form.duration,
      onChange: (e) => setForm({ ...form, duration: e.target.value })
    },
    durationOptions.map((dur) => /* @__PURE__ */ React.createElement("option", { key: dur, value: dur }, dur, " minutes"))
  )), /* @__PURE__ */ React.createElement("div", { className: "modal-row" }, /* @__PURE__ */ React.createElement("label", { className: "modal-field" }, /* @__PURE__ */ React.createElement("span", { className: "modal-label" }, "Break Start"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "time",
      className: "modal-input",
      value: form.breakStart,
      onChange: (e) => setForm({ ...form, breakStart: e.target.value })
    }
  )), /* @__PURE__ */ React.createElement("label", { className: "modal-field" }, /* @__PURE__ */ React.createElement("span", { className: "modal-label" }, "Break End"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "time",
      className: "modal-input",
      value: form.breakEnd,
      onChange: (e) => setForm({ ...form, breakEnd: e.target.value })
    }
  ))), /* @__PURE__ */ React.createElement("p", { className: "modal-hint", style: { marginTop: "-12px", marginBottom: "16px", fontSize: "13px", color: "var(--color-slate-500)" } }, "Leave empty for no break."), /* @__PURE__ */ React.createElement("p", { className: "modal-hint", style: { fontSize: "13px", color: "var(--color-slate-600)", fontStyle: "italic" } }, "Saving rebuilds your upcoming open times. Booked times are kept."), /* @__PURE__ */ React.createElement("div", { className: "modal-actions" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "button button--secondary", onClick: onClose, disabled: saving }, "Cancel"), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "button button--primary", disabled: saving }, saving ? "Saving\u2026" : "Save schedule")))));
}

// src/components/doctor/DaySlotsPanel.jsx
init_doctorService();
var import_react4 = require("react");

// src/components/doctor/EditSlotModal.jsx
var import_react3 = require("react");
var import_lucide_react3 = require("lucide-react");
init_doctorService();
function EditSlotModal({ slot, onClose, onSaved }) {
  const today = getTodayIso();
  const [date, setDate] = (0, import_react3.useState)(slot.date);
  const [startTime, setStartTime] = (0, import_react3.useState)(slot.startTime);
  const [endTime, setEndTime] = (0, import_react3.useState)(slot.endTime);
  const [error, setError] = (0, import_react3.useState)("");
  const [saving, setSaving] = (0, import_react3.useState)(false);
  (0, import_react3.useEffect)(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  function validate() {
    if (!date) return "Date is required.";
    if (!startTime) return "Start time is required.";
    if (!endTime) return "End time is required.";
    if (endTime <= startTime) return "End time must be after start time.";
    return "";
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    try {
      await updateMySlot(slot.id, { date, startTime, endTime });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update slot. Please try again.");
    } finally {
      setSaving(false);
    }
  }
  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "modal-overlay",
      onClick: handleOverlayClick,
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "Edit time slot"
    },
    /* @__PURE__ */ React.createElement("div", { className: "modal-panel" }, /* @__PURE__ */ React.createElement("header", { className: "modal-header" }, /* @__PURE__ */ React.createElement("h2", null, "Edit time slot"), /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "modal-close",
        type: "button",
        "aria-label": "Close",
        onClick: onClose
      },
      /* @__PURE__ */ React.createElement(import_lucide_react3.X, { size: 20 })
    )), /* @__PURE__ */ React.createElement("form", { className: "modal-form", onSubmit: handleSubmit, noValidate: true }, error && /* @__PURE__ */ React.createElement("p", { className: "modal-error", role: "alert" }, error), /* @__PURE__ */ React.createElement("label", { className: "modal-field" }, /* @__PURE__ */ React.createElement("span", { className: "modal-label" }, "Date"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "date",
        className: "modal-input",
        min: today,
        value: date,
        onChange: (e) => {
          setDate(e.target.value);
          setError("");
        },
        required: true
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "modal-row" }, /* @__PURE__ */ React.createElement("label", { className: "modal-field" }, /* @__PURE__ */ React.createElement("span", { className: "modal-label" }, "Start time"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "time",
        className: "modal-input",
        value: startTime,
        onChange: (e) => {
          setStartTime(e.target.value);
          setError("");
        },
        required: true
      }
    )), /* @__PURE__ */ React.createElement("label", { className: "modal-field" }, /* @__PURE__ */ React.createElement("span", { className: "modal-label" }, "End time"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "time",
        className: "modal-input",
        value: endTime,
        onChange: (e) => {
          setEndTime(e.target.value);
          setError("");
        },
        required: true
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "modal-actions" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "button button--secondary",
        onClick: onClose,
        disabled: saving
      },
      "Cancel"
    ), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "button", disabled: saving }, saving ? "Saving\u2026" : "Save changes"))))
  );
}

// src/components/doctor/DaySlotsPanel.jsx
function DaySlotsPanel({ date, slots, onSlotsChanged }) {
  const [editingSlot, setEditingSlot] = (0, import_react4.useState)(null);
  const [cancellingDay, setCancellingDay] = (0, import_react4.useState)(false);
  const [msg, setMsg] = (0, import_react4.useState)("");
  const displayDate = formatDisplayDate(date);
  const canCancelDay = slots.some((s) => s.status === "open" && !s.isBooked);
  const handleCancelDay = async () => {
    if (!window.confirm(`Cancel all open times on ${displayDate}? Booked times stay.`)) return;
    setCancellingDay(true);
    setMsg("");
    try {
      const res = await cancelMyDay(date);
      setMsg(res.message);
      onSlotsChanged();
    } catch (err) {
      setMsg(err.message || "Failed to cancel day.");
    } finally {
      setCancellingDay(false);
    }
  };
  const handleToggleStatus = async (slot) => {
    const newStatus = slot.status === "cancelled" ? "open" : "cancelled";
    setMsg("");
    try {
      await updateMySlot(slot.id, { status: newStatus });
      onSlotsChanged();
    } catch (err) {
      setMsg(err.message || `Failed to ${newStatus === "open" ? "reopen" : "cancel"} slot.`);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "schedule-day-panel" }, /* @__PURE__ */ React.createElement("div", { className: "schedule-day-header" }, /* @__PURE__ */ React.createElement("h3", null, displayDate), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "button button--secondary",
      onClick: handleCancelDay,
      disabled: !canCancelDay || cancellingDay
    },
    cancellingDay ? "Cancelling\u2026" : "Cancel day"
  )), msg && /* @__PURE__ */ React.createElement("p", { className: "schedule-msg schedule-msg--info", role: "status" }, msg), slots.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "schedule-empty-day" }, "No times on this day.") : /* @__PURE__ */ React.createElement("div", { className: "schedule-slot-grid" }, slots.map((slot) => {
    const isCancelled = slot.status === "cancelled";
    return /* @__PURE__ */ React.createElement("div", { key: slot.id, className: `schedule-slot-card ${isCancelled ? "schedule-slot-card--cancelled" : ""}` }, /* @__PURE__ */ React.createElement("div", { className: "schedule-slot-card__info" }, /* @__PURE__ */ React.createElement("span", { className: "schedule-slot-card__time" }, slot.label), /* @__PURE__ */ React.createElement("span", { className: "schedule-slot-card__range" }, slot.startTime, " \u2013 ", slot.endTime), slot.isBooked && /* @__PURE__ */ React.createElement("span", { className: "schedule-slot-card__badge schedule-slot-card__badge--booked" }, "Booked"), isCancelled && /* @__PURE__ */ React.createElement("span", { className: "schedule-slot-card__badge schedule-slot-card__badge--cancelled" }, "Cancelled")), /* @__PURE__ */ React.createElement("div", { className: "schedule-slot-card__actions" }, slot.isBooked ? /* @__PURE__ */ React.createElement("button", { type: "button", className: "button button--text", disabled: true, title: "Cannot edit booked slot" }, "Edit") : isCancelled ? /* @__PURE__ */ React.createElement("button", { type: "button", className: "button button--text", onClick: () => handleToggleStatus(slot) }, "Reopen") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { type: "button", className: "button button--text", onClick: () => setEditingSlot(slot) }, "Edit"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "button button--text", onClick: () => handleToggleStatus(slot) }, "Cancel"))));
  })), editingSlot && /* @__PURE__ */ React.createElement(
    EditSlotModal,
    {
      slot: editingSlot,
      onClose: () => setEditingSlot(null),
      onSaved: () => {
        setEditingSlot(null);
        onSlotsChanged();
      }
    }
  ));
}

// src/pages/doctor/Schedule.jsx
function Schedule() {
  const [schedule, setSchedule] = (0, import_react5.useState)(null);
  const [slots, setSlots] = (0, import_react5.useState)([]);
  const [loading, setLoading] = (0, import_react5.useState)(true);
  const [notSetup, setNotSetup] = (0, import_react5.useState)(false);
  const [notSetupMsg, setNotSetupMsg] = (0, import_react5.useState)("");
  const [fetchError, setFetchError] = (0, import_react5.useState)("");
  const [pageMsg, setPageMsg] = (0, import_react5.useState)("");
  const [showSettingsModal, setShowSettingsModal] = (0, import_react5.useState)(false);
  const [selectedDate, setSelectedDate] = (0, import_react5.useState)(getTodayIso());
  const loadData = (0, import_react5.useCallback)(async () => {
    setLoading(true);
    setFetchError("");
    setNotSetup(false);
    try {
      const sched = await getMySchedule();
      setSchedule(sched);
      try {
        await generateSlotsFromWorkingHours();
      } catch (e) {
      }
      const today = getTodayIso();
      const thirtyDays = /* @__PURE__ */ new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 29);
      const toStr = thirtyDays.toISOString().split("T")[0];
      const slotData = await getMySlots({ from: today, to: toStr });
      setSlots(slotData || []);
    } catch (err) {
      if (err.status === 404) {
        setNotSetup(true);
        setNotSetupMsg(err.message || "Your doctor profile has not been set up yet. Please contact an administrator.");
      } else {
        setFetchError(err.message || "Unable to load your schedule. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);
  (0, import_react5.useEffect)(() => {
    loadData();
  }, [loadData]);
  const upcomingDates = [];
  const todayDate = new Date(getTodayIso());
  for (let i = 0; i < 14; i++) {
    const d = new Date(todayDate);
    d.setDate(todayDate.getDate() + i);
    upcomingDates.push(d.toISOString().split("T")[0]);
  }
  (0, import_react5.useEffect)(() => {
    if (slots.length > 0 && selectedDate === getTodayIso()) {
      const firstDateWithSlots = slots.find((s) => s.status !== "cancelled")?.date;
      if (firstDateWithSlots) setSelectedDate(firstDateWithSlots);
    }
  }, [slots, selectedDate]);
  const slotsForSelected = slots.filter((s) => s.date === selectedDate);
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("header", { className: "page-heading" }, /* @__PURE__ */ React.createElement("h1", null, "My Schedule"), /* @__PURE__ */ React.createElement("p", null, "Manage your availability and upcoming consultations.")), pageMsg && /* @__PURE__ */ React.createElement("div", { className: "schedule-msg schedule-msg--success", role: "status", style: { marginBottom: "24px" } }, pageMsg), loading && /* @__PURE__ */ React.createElement("p", { className: "loading-text" }, "Loading schedule\u2026"), !loading && notSetup && /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(
    EmptyState,
    {
      icon: import_lucide_react4.UserCog,
      title: "Profile not set up yet",
      description: notSetupMsg
    }
  )), !loading && fetchError && /* @__PURE__ */ React.createElement("div", { className: "doctors-error" }, /* @__PURE__ */ React.createElement("p", { className: "doctors-error__msg" }, fetchError), /* @__PURE__ */ React.createElement("button", { className: "button button--secondary", type: "button", onClick: loadData }, "Try again")), !loading && !notSetup && !fetchError && /* @__PURE__ */ React.createElement("div", { className: "schedule-layout-new", style: { display: "flex", flexDirection: "column", gap: "24px" } }, /* @__PURE__ */ React.createElement(
    ScheduleSettingsCard,
    {
      schedule,
      onEdit: () => setShowSettingsModal(true)
    }
  ), /* @__PURE__ */ React.createElement(Card, { className: "schedule-days-card" }, /* @__PURE__ */ React.createElement("div", { className: "schedule-card__header" }, /* @__PURE__ */ React.createElement("h2", null, "Upcoming days")), /* @__PURE__ */ React.createElement("div", { className: "schedule-card__body" }, /* @__PURE__ */ React.createElement("div", { className: "schedule-week-strip", role: "tablist" }, upcomingDates.map((dateStr) => {
    const [y, m, d] = dateStr.split("-");
    const dateObj = new Date(y, m - 1, d);
    const isWorkingDay = schedule?.workingDays?.includes(dateObj.getDay());
    const hasSlots = slots.some((s) => s.date === dateStr && s.status !== "cancelled");
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: dateStr,
        type: "button",
        role: "tab",
        "aria-selected": selectedDate === dateStr,
        className: `schedule-date-tab ${selectedDate === dateStr ? "schedule-date-tab--selected" : ""} ${!isWorkingDay ? "schedule-date-tab--muted" : ""}`,
        onClick: () => setSelectedDate(dateStr)
      },
      formatShortDate(dateStr),
      hasSlots && /* @__PURE__ */ React.createElement("span", { className: "schedule-date-dot", "aria-hidden": "true" })
    );
  })), /* @__PURE__ */ React.createElement(
    DaySlotsPanel,
    {
      date: selectedDate,
      slots: slotsForSelected,
      onSlotsChanged: loadData
    }
  ))), /* @__PURE__ */ React.createElement("details", { className: "schedule-extra-details" }, /* @__PURE__ */ React.createElement("summary", { className: "schedule-extra-summary" }, /* @__PURE__ */ React.createElement("h3", null, "Add extra availability"), /* @__PURE__ */ React.createElement("p", null, "Need to open a one-off time outside your weekly schedule?")), /* @__PURE__ */ React.createElement("div", { className: "schedule-extra-body" }, /* @__PURE__ */ React.createElement(AvailabilityForm, { onCreated: loadData })))), showSettingsModal && /* @__PURE__ */ React.createElement(
    ScheduleSettingsModal,
    {
      schedule,
      onClose: () => setShowSettingsModal(false),
      onSave: async (payload) => {
        const { updateMySchedule: updateMySchedule2 } = await Promise.resolve().then(() => (init_doctorService(), doctorService_exports));
        const res = await updateMySchedule2(payload);
        setPageMsg(res.message);
        loadData();
      }
    }
  ));
}
