const request = require('supertest');
const app = require('../server');
const Appointment = require('../models/Appointment');
const AuditLog = require('../models/AuditLog');
const {
  connectTestDB,
  clearTestDB,
  disconnectTestDB,
  createTestUser,
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

describe('Admin Operations Suite (NFR-02, NFR-03, NFR-08)', () => {
  async function setupAdmin() {
    return createTestUser({
      name: 'System Admin',
      email: 'admin@curelink.test',
      role: 'admin',
    });
  }

  test('GET /api/admin/stats returns aggregated metrics', async () => {
    const { cookie: adminCookie } = await setupAdmin();
    await createTestDoctor({});
    await createTestPatient({});

    const res = await request(app)
      .get('/api/admin/stats')
      .set('Cookie', [adminCookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stats.totalDoctors).toBe(1);
    expect(res.body.stats.totalPatients).toBe(1);
  });

  test('Admin cannot delete a doctor with active appointments (409 Conflict Guard)', async () => {
    const { cookie: adminCookie } = await setupAdmin();
    const { doctor } = await createTestDoctor({});
    const { patient } = await createTestPatient({});

    // Create an active appointment
    await Appointment.create({
      patient: patient._id,
      doctor: doctor._id,
      date: new Date(),
      timeSlot: '09:00 AM',
      status: 'scheduled',
    });

    const res = await request(app)
      .delete(`/api/admin/doctors/${doctor._id}`)
      .set('Cookie', [adminCookie]);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/active\/upcoming appointment/i);
  });

  test('Admin can deactivate and reactivate patient with audit logs (NFR-03)', async () => {
    const { cookie: adminCookie } = await setupAdmin();
    const { user: patientUser } = await createTestPatient({ email: 'targetpatient@curelink.test' });

    // 1. Deactivate
    const deactRes = await request(app)
      .patch(`/api/admin/patients/${patientUser._id}/deactivate`)
      .set('Cookie', [adminCookie]);

    expect(deactRes.status).toBe(200);
    expect(deactRes.body.patient.isActive).toBe(false);

    // Verify audit log recorded
    const deactAudit = await AuditLog.findOne({
      action: 'PATIENT_DEACTIVATED',
      targetUser: patientUser._id,
    });
    expect(deactAudit).toBeDefined();

    // 2. Reactivate
    const reactRes = await request(app)
      .patch(`/api/admin/patients/${patientUser._id}/reactivate`)
      .set('Cookie', [adminCookie]);

    expect(reactRes.status).toBe(200);
    expect(reactRes.body.patient.isActive).toBe(true);

    const reactAudit = await AuditLog.findOne({
      action: 'PATIENT_REACTIVATED',
      targetUser: patientUser._id,
    });
    expect(reactAudit).toBeDefined();
  });

  test('GET /api/admin/appointments supports pagination (NFR-01, NFR-02)', async () => {
    const { cookie: adminCookie } = await setupAdmin();
    const { doctor } = await createTestDoctor({});
    const { patient } = await createTestPatient({});

    // Seed 5 appointments
    for (let i = 0; i < 5; i++) {
      await Appointment.create({
        patient: patient._id,
        doctor: doctor._id,
        date: new Date(),
        timeSlot: `1${i}:00 AM`,
        status: 'scheduled',
      });
    }

    const res = await request(app)
      .get('/api/admin/appointments?page=1&limit=2')
      .set('Cookie', [adminCookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.appointments.length).toBe(2);
    expect(res.body.total).toBe(5);
    expect(res.body.pages).toBe(3);
  });
});
