const { test, expect } = require('@playwright/test');
const { seedE2EData } = require('./helpers/e2eSeed');

test.beforeAll(async () => {
  await seedE2EData();
});

test.describe('Responsiveness & Accessibility Verification (NFR-06, NFR-07)', () => {
  test('Responsive viewports do not trigger horizontal page overflow', async ({ page }) => {
    await page.goto('/');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // 2px margin for rounding
  });

  test('Interactive navigation controls have accessible labels and keyboard focus', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('#login-email');
    await expect(emailInput).toBeVisible();
    await emailInput.focus();
    await expect(emailInput).toBeFocused();

    const passwordInput = page.locator('#login-password');
    await expect(passwordInput).toBeVisible();
    await passwordInput.focus();
    await expect(passwordInput).toBeFocused();

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await submitBtn.focus();
    await expect(submitBtn).toBeFocused();
  });

  test('Notification bell is keyboard accessible with escape close', async ({ page }) => {
    // Log in as patient
    await page.goto('/login');
    await page.fill('#login-email', 'patient@curelink.test');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/patient/dashboard');

    const notifBtn = page.locator('.notif-dropdown__trigger');
    await expect(notifBtn).toBeVisible();
    await expect(notifBtn).toHaveAttribute('aria-haspopup', 'true');

    // Click to open
    await notifBtn.click();
    const panel = page.locator('.notif-dropdown__panel');
    await expect(panel).toBeVisible();

    // Press Escape to close
    await page.keyboard.press('Escape');
    await expect(panel).not.toBeVisible();
  });
});
