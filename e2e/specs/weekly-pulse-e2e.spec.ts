import { test, expect, Page } from '@playwright/test';

const TEST_EMAIL = 'test@example.com';

// ISO week number calculation (copied from src/lib/utils/date.ts)
function getCurrentWeekNumber(date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Calculates the ISO week number for the week containing the most recent Thursday
function getMostRecentThursdayWeek(): number {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 4 = Thursday
  const daysToSubtract = dayOfWeek >= 4 ? dayOfWeek - 4 : dayOfWeek + 3;
  const lastThursday = new Date(now);
  lastThursday.setDate(now.getDate() - daysToSubtract);
  return getCurrentWeekNumber(lastThursday);
}

async function getAutoLoginToken(page: Page, email: string) {
  const response = await page.request.get(`/api/auth/generate-token?email=${email}`);
  const data = await response.json();
  if (!data.token) throw new Error('No token returned');
  return data.token;
}

async function deleteSubmission(page: Page, email: string, week: number) {
  const response = await page.request.delete(`/api/auth/delete-submission?email=${email}&week=${week}`);
  const data = await response.json();
  if (!data.success) throw new Error('Failed to delete submission');
}

test('Weekly Pulse E2E: submit form and verify post-submission state', async ({ page }) => {
  await test.step('Reset submission', async () => {
    const week = getMostRecentThursdayWeek();
    console.log('Deleting submission for week:', week);
    await deleteSubmission(page, TEST_EMAIL, week);
  });

  await test.step('Login and submit form', async () => {
    const token = await getAutoLoginToken(page, TEST_EMAIL);
    await page.goto(`/api/auth/auto-login?token=${token}`);
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
    await page.getByRole('button', { name: /Start Weekly Pulse/i }).click();
    await page.getByRole('button', { name: 'Capsule Transit' }).click();
    await page.getByRole('button', { name: /Next step/ }).click();
    await page.getByRole('button', { name: /Next step/ }).click();
    await page.getByRole('textbox', { name: /manager/i }).fill('manager@example.com');
    await page.getByRole('button', { name: /Next step/ }).click();
    await page.getByRole('button', { name: /Skip/i }).click();
    await page.getByRole('button', { name: /^Next$/ }).click();
    await page.getByRole('button', { name: /^Next$/ }).click();
    await page.getByRole('textbox', { name: /hour reporting/i }).fill('Reporting hours helps me reflect on my weekly progress.');
    await page.getByRole('button', { name: /^Next$/ }).click();
    await page.getByRole('button', { name: '3 min' }).click();
    await page.getByRole('button', { name: /^Next$/ }).click();
    await page.getByRole('button', { name: /Submit Now/i }).click();
    await expect(page.getByRole('heading', { name: /Submission received/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /View My History/i })).toBeVisible();
  });

  await test.step('Login again and verify post-submission', async () => {
    const token2 = await getAutoLoginToken(page, TEST_EMAIL);
    await page.goto(`/api/auth/auto-login?token=${token2}`);
    await expect(page.getByRole('heading', { name: /You're on fire! 🔥/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /View My Submission History/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Start Weekly Pulse/i })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /What project did you spend most of your time on/i })).toHaveCount(0);
  });
}); 