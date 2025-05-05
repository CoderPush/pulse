import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/auth/login');
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should display login page correctly', async ({ page }) => {
    // Check if the page title is correct
    await expect(page).toHaveTitle(/Weekly Pulse/);

    // Check if the main heading is visible
    await expect(page.getByRole('heading', { name: 'Weekly Pulse' })).toBeVisible();

    // Check if the subtitle is visible
    await expect(page.getByText('Track your weekly pulse')).toBeVisible();

    // Check if the Google sign-in button is present
    const googleButton = page.getByRole('button', { name: /Sign in with Google/i });
    await expect(googleButton).toBeVisible();
  });
}); 