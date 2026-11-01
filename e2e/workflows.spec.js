const { test, expect } = require('@playwright/test');
const { seedE2EData } = require('./helpers/e2eSeed');

test.beforeAll(async () => {
  await seedE2EData();
});

test.describe('CureLink End-to-End User Workflows (NFR-05, NFR-06)', () => {
  test('Landing page loads with brand, navigation, and service highlights', async ({ page }) => {
    await page.goto('/');

    // Check title or brand presence
    await expect(page.locator('text=CureLink').first()).toBeVisible();
    await expect(page.locator('text=Portal Sign In').or(page.locator('text=Sign In')).first()).toBeVisible();
  });

  test('Patient login flow and dashboard navigation', async ({ page }) => {
    await page.goto('/login');

    // Fill login form
    await page.fill('#login-email', 'patient@curelink.test');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');

    // Should redirect to /patient/dashboard
    await page.waitForURL('**/patient/dashboard');
    await expect(page.locator('text=Welcome back').or(page.locator('text=Dashboard')).first()).toBeVisible();

    // Navigate to Doctors directory
    await page.click('a[href="/patient/doctors"]');
    await page.waitForURL('**/patient/doctors');
    await expect(page.locator('text=Dr. Sarah Connor')).toBeVisible();

    // Open Doctor profile
    await page.click('a:has-text("View profile")');
    await page.waitForURL('**/patient/doctors/**');
    await expect(page.locator('text=Cardiology').first()).toBeVisible();

    // Check Profile page
    await page.click('a[href="/patient/profile"]');
    await page.waitForURL('**/patient/profile');
    await expect(page.locator('text=John Doe').first()).toBeVisible();
  });

  test('Doctor login flow and dashboard oversight', async ({ page }) => {
    await page.goto('/login');

    await page.fill('#login-email', 'doctor@curelink.test');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');

    // Should redirect to doctor dashboard
    await page.waitForURL('**/doctor/dashboard');
    await expect(page.locator('text=Dr. Sarah Connor').or(page.locator('text=Doctor Dashboard')).first()).toBeVisible();

    // Navigate to Schedule
    await page.click('a[href="/doctor/schedule"]');
    await page.waitForURL('**/doctor/schedule');
    await expect(page.locator('text=Schedule').first()).toBeVisible();
  });

  test('Admin login flow and platform oversight (AC-01)', async ({ page }) => {
    await page.goto('/login');

    await page.fill('#login-email', 'admin@curelink.test');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');

    // Should redirect to admin dashboard
    await page.waitForURL('**/admin/dashboard');
    await expect(page.locator('text=Admin Overview').first()).toBeVisible();

    // Navigate to Doctors management
    await page.click('a[href="/admin/doctors"]');
    await page.waitForURL('**/admin/doctors');
    await expect(page.locator('text=Dr. Sarah Connor')).toBeVisible();

    // Navigate to Patients management
    await page.click('a[href="/admin/patients"]');
    await page.waitForURL('**/admin/patients');
    await expect(page.locator('text=John Doe')).toBeVisible();
  });
});
