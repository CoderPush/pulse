import { test, expect } from '@playwright/test';
import { autoLogin, createTestUser } from '../fixtures/auth';

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

test.describe('Auto Login', () => {
  let testUser: { id: string; email: string };

  test.beforeEach(async () => {
    // Create test user once for all tests
    testUser = await createTestUser('test@example.com');
  });

  test('can auto login with valid token and redirects to home', async ({ page }) => {
    await autoLogin(page, testUser.email);
    await expect(page).toHaveURL('/');
  });

  test('redirects to home after successful login', async ({ page }) => {
    await autoLogin(page, testUser.email);
    await page.goto('/');
    await expect(page).toHaveURL('/');
  });

  test('handles invalid token', async ({ page }) => {
    await page.goto('/api/auth/auto-login?token=invalid');
    await expect(page).toHaveURL('/auth/login');
  });

  test('handles missing token', async ({ page }) => {
    await page.goto('/api/auth/auto-login');
    await expect(page).toHaveURL('/auth/login');
  });

  test('can access protected routes after login', async ({ page }) => {
    await autoLogin(page, testUser.email);
    
    // Try accessing various protected routes
    const protectedRoutes = ['/history', '/profile'];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(route);
      // Verify we're not redirected to login
      await expect(page).not.toHaveURL('/auth/login');
    }
  });

  test('maintains session across page reloads', async ({ page }) => {
    await autoLogin(page, testUser.email);
    
    // Visit dashboard
    await page.goto('/');
    await expect(page).toHaveURL('/');
    
    // Reload page
    await page.reload();
    await expect(page).toHaveURL('/');
  });

  test('handles concurrent auto-login attempts', async ({ browser }) => {
    // Create two pages
    const page1 = await browser.newPage();
    const page2 = await browser.newPage();
    
    try {
      // Attempt auto-login on both pages simultaneously
      await Promise.all([
        autoLogin(page1, testUser.email),
        autoLogin(page2, testUser.email)
      ]);
      
      // Verify both pages are logged in
      await expect(page1).toHaveURL('/');
      await expect(page2).toHaveURL('/');
    } finally {
      // Cleanup
      await page1.close();
      await page2.close();
    }
  });
}); 