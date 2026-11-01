const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { connectTestDB, disconnectTestDB, createTestUser, createTestDoctor } = require('./testHelper');

function getFutureWeekday(daysAhead = 3) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysAhead);
  if (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1); // Sunday -> Monday
  if (d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() + 2); // Saturday -> Monday
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function runBenchmark() {
  await connectTestDB();
  console.log('--- Connected to test database for benchmark ---');

  const suffix = Date.now();
  const { user: testPatient } = await createTestUser({
    name: `Bench Patient ${suffix}`,
    email: `bench_patient_${suffix}@test.local`,
    password: 'Password123!',
    role: 'patient',
  });

  const { user: testDocUser, doctor: testDoctor } = await createTestDoctor({
    name: `Bench Doctor ${suffix}`,
    email: `bench_doc_${suffix}@test.local`,
    specialization: 'Cardiology',
  });

  const { user: testAdminUser } = await createTestUser({
    name: `Bench Admin ${suffix}`,
    email: `bench_admin_${suffix}@test.local`,
    password: 'Password123!',
    role: 'admin',
  });

  async function timeRequest(name, fn) {
    const start = process.hrtime.bigint();
    const res = await fn();
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    return { name, durationMs: durationMs.toFixed(2), status: res.status, res };
  }

  const successOps = [];
  const rejectionOps = [];

  // ==========================================
  // SECTION 1: SUCCESSFUL BUSINESS OPERATIONS
  // ==========================================

  // 1. Patient Login (200 OK)
  let patientCookie = '';
  const patLogin = await timeRequest('POST /api/auth/login (Patient)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testPatient.email, password: 'Password123!' });
    patientCookie = res.headers['set-cookie'];
    return res;
  });
  successOps.push(patLogin);

  // 2. Doctor Login (200 OK)
  let docCookie = '';
  successOps.push(await timeRequest('POST /api/auth/login (Doctor)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testDocUser.email, password: 'Password123!' });
    docCookie = res.headers['set-cookie'];
    return res;
  }));

  // 3. Admin Login (200 OK)
  let adminCookie = '';
  successOps.push(await timeRequest('POST /api/auth/login (Admin)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testAdminUser.email, password: 'Password123!' });
    adminCookie = res.headers['set-cookie'];
    return res;
  }));

  // 4. GET /api/doctors (200 OK)
  successOps.push(await timeRequest('GET /api/doctors (Directory listing)', async () => {
    return request(app).get('/api/doctors').set('Cookie', patientCookie);
  }));

  // 5. GET /api/doctors/:id/availability (200 OK)
  const testDate = getFutureWeekday(3);
  successOps.push(await timeRequest('GET /api/doctors/:id/availability (Dynamic slots)', async () => {
    return request(app)
      .get(`/api/doctors/${testDoctor._id}/availability?date=${testDate}`)
      .set('Cookie', patientCookie);
  }));

  // 6. POST /api/appointments (201 Created - Successful booking)
  let appointmentId = '';
  successOps.push(await timeRequest('POST /api/appointments (Successful slot booking)', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Cookie', patientCookie)
      .send({
        doctorId: testDoctor._id.toString(),
        date: testDate,
        timeSlot: '9:00 AM',
        reason: 'Performance benchmark checkup',
        patient: { phone: '9876543210' },
      });
    if (res.body?._id) {
      appointmentId = res.body._id;
    }
    return res;
  }));

  // 7. GET /api/appointments/me (200 OK)
  successOps.push(await timeRequest('GET /api/appointments/me (Patient listing)', async () => {
    return request(app)
      .get('/api/appointments/me')
      .set('Cookie', patientCookie);
  }));

  // 8. GET /api/admin/stats (200 OK)
  successOps.push(await timeRequest('GET /api/admin/stats (Admin aggregation)', async () => {
    return request(app)
      .get('/api/admin/stats')
      .set('Cookie', adminCookie);
  }));

  // 9. GET /api/admin/patients?page=1&limit=10 (200 OK - Paginated + Lean)
  successOps.push(await timeRequest('GET /api/admin/patients?page=1&limit=10 (Lean pagination)', async () => {
    return request(app)
      .get('/api/admin/patients?page=1&limit=10')
      .set('Cookie', adminCookie);
  }));

  // 10. PUT /api/appointments/:id/cancel (200 OK)
  if (appointmentId) {
    successOps.push(await timeRequest('PUT /api/appointments/:id/cancel (Cancellation)', async () => {
      return request(app)
        .put(`/api/appointments/${appointmentId}/cancel`)
        .set('Cookie', patientCookie)
        .send({ cancellationReason: 'Bench cancellation' });
    }));
  }

  // ==========================================
  // SECTION 2: VALIDATION & SECURITY REJECTIONS
  // ==========================================

  // 1. Unauthenticated rejection (401 Unauthorized)
  rejectionOps.push(await timeRequest('GET /api/auth/me (Unauthenticated -> 401)', async () => {
    return request(app).get('/api/auth/me');
  }));

  // 2. Unauthorized role access (403 Forbidden - Patient -> Admin)
  rejectionOps.push(await timeRequest('GET /api/admin/stats (Patient caller -> 403)', async () => {
    return request(app).get('/api/admin/stats').set('Cookie', patientCookie);
  }));

  // 3. Double-booking conflict (409 Conflict)
  // Create an appointment first to trigger 409
  const conflictDate = getFutureWeekday(4);
  const existingApt = await Appointment.create({
    patient: testPatient._id,
    doctor: testDoctor._id,
    date: conflictDate,
    timeSlot: '9:00 AM',
    status: 'scheduled',
    reason: 'Existing appointment',
  });

  rejectionOps.push(await timeRequest('POST /api/appointments (Duplicate slot collision -> 409)', async () => {
    return request(app)
      .post('/api/appointments')
      .set('Cookie', patientCookie)
      .send({
        doctorId: testDoctor._id.toString(),
        date: conflictDate,
        timeSlot: '9:00 AM',
        reason: 'Collision test',
        patient: { phone: '9876543210' },
      });
  }));

  // 4. Missing required input (400 Bad Request)
  rejectionOps.push(await timeRequest('POST /api/appointments (Missing required fields -> 400)', async () => {
    return request(app)
      .post('/api/appointments')
      .set('Cookie', patientCookie)
      .send({});
  }));

  console.log('\n=== SECTION A: SUCCESSFUL BUSINESS OPERATIONS ===');
  console.table(successOps.map(r => ({
    Operation: r.name,
    'HTTP Status': r.status,
    'Response Time': `${r.durationMs} ms`,
  })));

  console.log('\n=== SECTION B: VALIDATION & SECURITY REJECTIONS ===');
  console.table(rejectionOps.map(r => ({
    Operation: r.name,
    'HTTP Status': r.status,
    'Response Time': `${r.durationMs} ms`,
  })));

  // Clean up benchmark test records
  await User.deleteMany({ _id: { $in: [testPatient._id, testDocUser._id, testAdminUser._id] } });
  await Doctor.deleteMany({ _id: testDoctor._id });
  if (appointmentId) {
    await Appointment.deleteMany({ _id: appointmentId });
  }
  if (existingApt) {
    await Appointment.deleteMany({ _id: existingApt._id });
  }

  await disconnectTestDB();
  console.log('--- Benchmark completed and benchmark data cleaned up ---');
}

runBenchmark().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
