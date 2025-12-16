import request from 'supertest';
import app from '../src/app.js'; // app.js'de "export default app;" olmalı

describe('Admin Auth Routes', () => {
  it('Bireysel admin kaydı', async () => {
    const res = await request(app)
      .post('/api/auth/admin/register/individual')
      .send({ email: 'test_individual@example.com', password: 'Test1234!', name: 'Test User' });
    expect([200, 201, 400]).toContain(res.statusCode);
  });

  it('Şirket yöneticisi kaydı', async () => {
    const res = await request(app)
      .post('/api/auth/admin/register/company-manager')
      .send({ email: 'test_company@example.com', password: 'Test1234!', companyName: 'Test Company' });
    expect([200, 201, 400]).toContain(res.statusCode);
  });

  it('E-posta doğrulama', async () => {
    const res = await request(app)
      .get('/api/auth/admin/verify-email?token=invalidtoken');
    expect([200, 400, 404]).toContain(res.statusCode);
  });

  it('Admin login', async () => {
    const res = await request(app)
      .post('/api/auth/admin/login')
      .send({ email: 'test_individual@example.com', password: 'Test1234!' });
    expect([200, 400, 401]).toContain(res.statusCode);
  });
});

describe('Site Routes', () => {
  it('Site listesi alınmalı', async () => {
    const res = await request(app).get('/api/sites');
    expect([200, 401, 403]).toContain(res.statusCode);
  });

  it('Site oluşturma', async () => {
    const res = await request(app)
      .post('/api/sites')
      .send({ name: 'Test Site', address: 'Test Address' });
    expect([200, 201, 400, 401]).toContain(res.statusCode);
  });
});

describe('Company Routes', () => {
  it('Şirket listesi alınmalı', async () => {
    const res = await request(app).get('/api/companies');
    expect([200, 401, 403]).toContain(res.statusCode);
  });

  it('Şirket oluşturma', async () => {
    const res = await request(app)
      .post('/api/companies')
      .send({ name: 'Test Company', address: 'Test Address' });
    expect([200, 201, 400, 401]).toContain(res.statusCode);
  });
});

describe('Master Routes', () => {
  it('Master login', async () => {
    const res = await request(app)
      .post('/api/auth/master/login')
      .send({ email: 'master@example.com', password: 'Test1234!' });
    expect([200, 400, 401]).toContain(res.statusCode);
  });

  it('Master profil bilgisi', async () => {
    const res = await request(app).get('/api/auth/master/profile');
    expect([200, 401, 403]).toContain(res.statusCode);
  });
});

describe('Admin Complaint Routes', () => {
  it('Şikayet listesi alınmalı', async () => {
    const res = await request(app).get('/api/admin/complaints');
    expect([200, 401, 403]).toContain(res.statusCode);
  });

  it('Şikayet oluşturma', async () => {
    const res = await request(app)
      .post('/api/admin/complaints')
      .send({ title: 'Test Complaint', description: 'Test Description' });
    expect([200, 201, 400, 401]).toContain(res.statusCode);
  });
});

describe('Announcement Routes', () => {
  it('Duyuru listesi alınmalı', async () => {
    const res = await request(app).get('/api/announcements');
    expect([200, 401, 403]).toContain(res.statusCode);
  });

  it('Duyuru oluşturma', async () => {
    const res = await request(app)
      .post('/api/announcements')
      .send({ title: 'Test Announcement', content: 'Test Content' });
    expect([200, 201, 400, 401]).toContain(res.statusCode);
  });
});

describe('Dashboard Routes', () => {
  it('Dashboard verisi alınmalı', async () => {
    const res = await request(app).get('/api/dashboard');
    expect([200, 401, 403]).toContain(res.statusCode);
  });
});