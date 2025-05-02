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

  test('should handle successful login', async ({ page, context }) => {
    // 1. Mock the final callback step (success)
    await page.route('**/auth/callback**', async (route) => {
      await route.fulfill({
        status: 302, // Use 302 for redirect
        headers: {
          Location: '/', // Redirect to home on success
        },
      });
    });

    // 2. Intercept the initial navigation to the OAuth provider
    await page.route('**/auth/v1/authorize**', async (route) => {
      // Prevent actual navigation and simulate immediate redirect back to callback
      const redirectTo = new URL(route.request().url()).searchParams.get('redirect_to');
      expect(redirectTo).not.toBeNull();
      const callbackUrl = redirectTo || '/auth/callback';
      await route.fulfill({
        status: 302,
        headers: {
          Location: callbackUrl + '?code=mock_code', // Simulate redirect with a code
        },
      });
    });

    // Click the Google sign-in button
    const googleButton = page.getByRole('button', { name: /Sign in with Google/i });
    // Use Promise.all to handle potential concurrent navigation/requests after click
    await Promise.all([
      page.waitForURL('/', { waitUntil: 'networkidle' }), // Wait for final navigation to home
      googleButton.click(),
    ]);

    // Verify we're on the home page
    await expect(page).toHaveURL('/');
  });

  test('should handle failed login', async ({ page, context }) => {
    // 1. Mock the final callback step (failure)
    await page.route('**/auth/callback**', async (route) => {
      await route.fulfill({
        status: 302,
        headers: {
          Location: '/auth/login?error=authentication_failed', // Redirect back to login with error
        },
      });
    });

    // 2. Intercept the initial navigation to the OAuth provider
    await page.route('**/auth/v1/authorize**', async (route) => {
      // Prevent actual navigation and simulate immediate redirect back to callback
      const redirectTo = new URL(route.request().url()).searchParams.get('redirect_to');
      expect(redirectTo).not.toBeNull();
      const callbackUrl = redirectTo || '/auth/callback';
      await route.fulfill({
        status: 302,
        headers: {
          Location: callbackUrl + '?error=mock_fail_condition', // Simulate redirect with an error
        },
      });
    });

    // Click the Google sign-in button
    const googleButton = page.getByRole('button', { name: /Sign in with Google/i });
    // Use Promise.all to handle potential concurrent navigation/requests after click
    await Promise.all([
      page.waitForURL(/\/auth\/login\?error=.*/, { waitUntil: 'networkidle' }), // Wait for final navigation back to login with error
      googleButton.click(),
    ]);

    // Verify we're back on the login page with an error parameter
    await expect(page.url()).toMatch(/\/auth\/login\?error=.*/);

    // Verify that an error message is displayed to the user
    await expect(page.getByText(/authentication failed|login error|unable to sign in/i)).toBeVisible();
  });
}); 