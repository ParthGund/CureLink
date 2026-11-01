const request = require('supertest');
const app = require('../server');
const Appointment = require('../models/Appointment');
const {
  connectTestDB,
  clearTestDB,
  disconnectTestDB,
  createTestDoctor,
  createTestPatient,
} = require('./testHelper');

beforeAll(async () => {
  await connectTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe('Appointment & Double-Booking Prevention Suite (NFR-01, NFR-03, AC-03, AC-04)', () => {
  // Helper to calculate future date string (YYYY-MM-DD) on a weekday in UTC
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

  test('Patient books an appointment for an available slot (AC-03)', async () => {
    const { doctor } = await createTestDoctor({});
    const { cookie: patientCookie } = await createTestPatient({});

    const testDate = getFutureWeekday(3);

    const res = await request(app)
      .post('/api/appointments')
      .set('Cookie', [patientCookie])
      .send({
        doctorId: doctor._id.toString(),
        date: testDate,
        timeSlot: '9:00 AM',
        reason: 'Regular consultation checkup',
        patient: { phone: '9876543210' },
      });

    expect(res.status).toBe(201);
    expect(res.body.doctor._id.toString()).toBe(doctor._id.toString());
    expect(res.body.timeSlot).toBe('9:00 AM');
    expect(res.body.status).toBe('scheduled');
  });

  test('Simultaneous / duplicate booking of same slot is rejected with 409 Conflict (AC-04)', async () => {
    const { doctor } = await createTestDoctor({});
    const { cookie: patient1Cookie } = await createTestPatient({ email: 'p1@curelink.test' });
    const { cookie: patient2Cookie } = await createTestPatient({ email: 'p2@curelink.test' });

    const testDate = getFutureWeekday(4);

    // First booking succeeds
    const firstRes = await request(app)
      .post('/api/appointments')
      .set('Cookie', [patient1Cookie])
      .send({
        doctorId: doctor._id.toString(),
        date: testDate,
        timeSlot: '10:00 AM',
        reason: 'First booking',
        patient: { phone: '9876543210' },
      });

    expect(firstRes.status).toBe(201);

    // Second booking on the exact same doctor + date + timeSlot must fail with 409
    const secondRes = await request(app)
      .post('/api/appointments')
      .set('Cookie', [patient2Cookie])
      .send({
        doctorId: doctor._id.toString(),
        date: testDate,
        timeSlot: '10:00 AM',
        reason: 'Competing booking attempt',
        patient: { phone: '9123456789' },
      });

    expect(secondRes.status).toBe(409);
    expect(secondRes.body.success).toBe(false);
    expect(secondRes.body.message).toMatch(/already been booked/i);
  });

  test('Patient cannot view another patient appointment (Ownership AC-06, NFR-03)', async () => {
    const { doctor } = await createTestDoctor({});
    const { cookie: patient1Cookie } = await createTestPatient({ email: 'patient1@curelink.test' });
    const { cookie: patient2Cookie } = await createTestPatient({ email: 'patient2@curelink.test' });

    const testDate = getFutureWeekday(5);

    // Patient 1 books
    const bookRes = await request(app)
      .post('/api/appointments')
      .set('Cookie', [patient1Cookie])
      .send({
        doctorId: doctor._id.toString(),
        date: testDate,
        timeSlot: '11:00 AM',
        reason: 'Confidential checkup',
        patient: { phone: '9876543210' },
      });

    const appointmentId = bookRes.body._id;

    // Patient 2 attempts to fetch Patient 1's appointment
    const accessRes = await request(app)
      .get(`/api/appointments/${appointmentId}`)
      .set('Cookie', [patient2Cookie]);

    expect(accessRes.status).toBe(403);
    expect(accessRes.body.success).toBe(false);
  });

  test('Patient can cancel their own active appointment', async () => {
    const { doctor } = await createTestDoctor({});
    const { cookie: patientCookie } = await createTestPatient({});

    const testDate = getFutureWeekday(6);

    const bookRes = await request(app)
      .post('/api/appointments')
      .set('Cookie', [patientCookie])
      .send({
        doctorId: doctor._id.toString(),
        date: testDate,
        timeSlot: '2:00 PM',
        reason: 'Tooth pain',
        patient: { phone: '9876543210' },
      });

    const appointmentId = bookRes.body._id;

    const cancelRes = await request(app)
      .put(`/api/appointments/${appointmentId}/cancel`)
      .set('Cookie', [patientCookie]);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.appointment.status).toBe('cancelled');
  });
});
