const request = require('supertest');
const app = require('../server');
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

describe('System Reliability & Concurrency Suite (NFR-02, NFR-04)', () => {
  test('GET /api/status returns operational health payload', async () => {
    const res = await request(app).get('/api/status');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('online');
    expect(res.body.phase).toBe('operational');
  });

  test('Invalid ObjectId parameters are safely caught without server crash', async () => {
    const { cookie } = await createTestPatient({});

    const res = await request(app)
      .get('/api/appointments/not-a-valid-id')
      .set('Cookie', [cookie]);

    expect([400, 404]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  test('Concurrency test: handles 20 simultaneous read requests gracefully (NFR-02)', async () => {
    const { cookie } = await createTestPatient({});
    await createTestDoctor({ name: 'Dr. Benchmarker 1' });
    await createTestDoctor({ name: 'Dr. Benchmarker 2', email: 'doc2@bench.test' });

    const requests = Array.from({ length: 20 }, () =>
      request(app)
        .get('/api/doctors')
        .set('Cookie', [cookie])
    );

    const startTime = Date.now();
    const responses = await Promise.all(requests);
    const duration = Date.now() - startTime;

    // All 20 requests should succeed with 200 OK
    for (const res of responses) {
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.doctors.length).toBe(2);
    }

    // Verify 20 parallel requests finish within reasonable time for an academic project (< 3000ms)
    expect(duration).toBeLessThan(3000);
  });
});
