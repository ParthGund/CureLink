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

describe('Consultation & Prescription Lifecycle Suite (NFR-03, NFR-04, AC-05, AC-06)', () => {
  async function setupBookedAppointment() {
    const { doctor, cookie: doctorCookie } = await createTestDoctor({ name: 'Dr. Gregory House' });
    const { patient, cookie: patientCookie } = await createTestPatient({ name: 'James Wilson' });

    const appointment = await Appointment.create({
      patient: patient._id,
      doctor: doctor._id,
      date: new Date(),
      timeSlot: '10:00 AM',
      status: 'scheduled',
      reason: 'General consultation',
    });

    return { doctor, doctorCookie, patient, patientCookie, appointment };
  }

  test('Assigned doctor starts a consultation successfully', async () => {
    const { doctorCookie, appointment } = await setupBookedAppointment();

    const res = await request(app)
      .post('/api/consultations')
      .set('Cookie', [doctorCookie])
      .send({ appointmentId: appointment._id.toString() });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.consultation.status).toBe('in_progress');
  });

  test('Unassigned doctor cannot start consultation for another doctor appointment (403 Forbidden)', async () => {
    const { appointment } = await setupBookedAppointment();
    const { cookie: unassignedDoctorCookie } = await createTestDoctor({
      name: 'Dr. Other Doctor',
      email: 'otherdoc@curelink.test',
    });

    const res = await request(app)
      .post('/api/consultations')
      .set('Cookie', [unassignedDoctorCookie])
      .send({ appointmentId: appointment._id.toString() });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('Doctor adds prescription and completes consultation atomically (AC-05)', async () => {
    const { doctorCookie, patientCookie, appointment } = await setupBookedAppointment();

    // 1. Start consultation
    const startRes = await request(app)
      .post('/api/consultations')
      .set('Cookie', [doctorCookie])
      .send({ appointmentId: appointment._id.toString() });

    const consultationId = startRes.body.consultation._id;

    // 2. Add diagnosis and treatment plan
    const updateRes = await request(app)
      .put(`/api/consultations/${consultationId}`)
      .set('Cookie', [doctorCookie])
      .send({
        diagnosis: 'Acute viral pharyngitis',
        clinicalNotes: 'Throat red, no exudate. Patient afebrile.',
        treatmentPlan: 'Hydration and rest for 5 days.',
      });

    expect(updateRes.status).toBe(200);

    // 3. Add prescription
    const prescRes = await request(app)
      .put(`/api/prescriptions/consultation/${consultationId}`)
      .set('Cookie', [doctorCookie])
      .send({
        items: [
          {
            medicine: 'Paracetamol 500mg',
            dosage: '1 tablet',
            frequency: 'Thrice daily',
            duration: '5 days',
            durationDays: 5,
            instructions: 'After meals',
          },
        ],
      });

    expect(prescRes.status).toBe(200);

    // 4. Complete consultation
    const completeRes = await request(app)
      .put(`/api/consultations/${consultationId}/complete`)
      .set('Cookie', [doctorCookie]);

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.consultation.status).toBe('completed');

    // Verify appointment was also marked completed
    const updatedApt = await Appointment.findById(appointment._id);
    expect(updatedApt.status).toBe('completed');

    // 5. Patient views completed consultation (AC-06: clinicalNotes must be stripped!)
    const patientViewRes = await request(app)
      .get(`/api/consultations/${consultationId}`)
      .set('Cookie', [patientCookie]);

    expect(patientViewRes.status).toBe(200);
    expect(patientViewRes.body.consultation.diagnosis).toBe('Acute viral pharyngitis');
    expect(patientViewRes.body.consultation.clinicalNotes).toBeUndefined(); // Confidentiality check!

    // 6. Patient reads active prescriptions
    const activeMedsRes = await request(app)
      .get('/api/prescriptions/me/active')
      .set('Cookie', [patientCookie]);

    expect(activeMedsRes.status).toBe(200);
    expect(activeMedsRes.body.medicines.length).toBeGreaterThan(0);
    expect(activeMedsRes.body.medicines[0].medicine).toBe('Paracetamol 500mg');
  });

  test('Completed consultation is immutable and rejects further edits (400 Bad Request)', async () => {
    const { doctorCookie, appointment } = await setupBookedAppointment();

    // Start, update with diagnosis, complete
    const startRes = await request(app)
      .post('/api/consultations')
      .set('Cookie', [doctorCookie])
      .send({ appointmentId: appointment._id.toString() });

    const consultationId = startRes.body.consultation._id;

    await request(app)
      .put(`/api/consultations/${consultationId}`)
      .set('Cookie', [doctorCookie])
      .send({ diagnosis: 'Final Diagnosis' });

    await request(app)
      .put(`/api/consultations/${consultationId}/complete`)
      .set('Cookie', [doctorCookie]);

    // Attempting edit on completed consultation must fail
    const editRes = await request(app)
      .put(`/api/consultations/${consultationId}`)
      .set('Cookie', [doctorCookie])
      .send({ diagnosis: 'Illegal tampering attempt' });

    expect(editRes.status).toBe(400);
  });
});
