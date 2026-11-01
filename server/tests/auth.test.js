const request = require('supertest');
const app = require('../server');
const {
  connectTestDB,
  clearTestDB,
  disconnectTestDB,
  createTestUser,
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

describe('Authentication & Authorization Suite (NFR-03: Security)', () => {
  test('POST /api/auth/register creates a patient account and sets httpOnly cookie', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Springs',
        email: 'alice@curelink.test',
        password: 'ValidPassword123!',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('alice@curelink.test');
    expect(res.body.user.role).toBe('patient');

    // Verify HttpOnly cookie
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/jwt=/);
    expect(cookies[0]).toMatch(/HttpOnly/i);
  });

  test('POST /api/auth/register rejects duplicate email with 409 Conflict', async () => {
    await createTestUser({
      name: 'Existing User',
      email: 'duplicate@curelink.test',
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate Attempt',
        email: 'duplicate@curelink.test',
        password: 'Password123!',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login succeeds with valid credentials', async () => {
    await createTestUser({
      name: 'Bob Patient',
      email: 'bob@curelink.test',
      password: 'MySecretPassword123!',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'bob@curelink.test',
        password: 'MySecretPassword123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('bob@curelink.test');
  });

  test('POST /api/auth/login rejects invalid password with 401 Unauthorized', async () => {
    await createTestUser({
      name: 'Bob Patient',
      email: 'bob2@curelink.test',
      password: 'CorrectPassword123!',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'bob2@curelink.test',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Deactivated patient login is rejected with 403 Forbidden', async () => {
    await createTestUser({
      name: 'Deactivated User',
      email: 'deactivated@curelink.test',
      password: 'Password123!',
      isActive: false,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'deactivated@curelink.test',
        password: 'Password123!',
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  test('Deactivated patient cannot access protected routes (403 Forbidden)', async () => {
    const { cookie } = await createTestUser({
      name: 'Deactivated User',
      email: 'deactivated2@curelink.test',
      isActive: false,
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  test('Patient calling admin route is rejected with 403 Forbidden (AC-01)', async () => {
    const { cookie } = await createTestUser({
      name: 'Patient Tester',
      email: 'regularpatient@curelink.test',
      role: 'patient',
    });

    const res = await request(app)
      .get('/api/admin/stats')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/insufficient permissions/i);
  });

  test('Patient calling doctor-only consultation route is rejected with 403 Forbidden', async () => {
    const { cookie } = await createTestUser({
      name: 'Patient Tester 2',
      email: 'patient2@curelink.test',
      role: 'patient',
    });

    const res = await request(app)
      .get('/api/consultations/doctor/me')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(403);
  });

  test('Doctor calling admin route is rejected with 403 Forbidden', async () => {
    const { cookie } = await createTestUser({
      name: 'Doctor Tester',
      email: 'doctor_priv@curelink.test',
      role: 'doctor',
    });

    const res = await request(app)
      .get('/api/admin/stats')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(403);
  });

  test('Unauthenticated request to protected route is rejected with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
