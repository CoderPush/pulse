import { test, expect } from '@playwright/test';
import { autoLogin, createTestUser } from '../fixtures/auth';
import { getCompanyDomain } from '@/utils/companyDomain';

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

    // Check if the mascot SVG is visible
    const mascot = page.locator('svg[width="64"][height="64"][viewBox="0 0 64 64"]');
    await expect(mascot).toBeVisible();
    // Optionally, check for the mascot's unique attributes
    await expect(mascot).toHaveAttribute('width', '64');
    await expect(mascot).toHaveAttribute('height', '64');

    // Check for the small subtitle
    await expect(page.getByText("Let's check in!", { exact: false })).toBeVisible();

    // Check if the main heading is visible and styled
    const cardTitle = page.locator('div[data-slot="card-title"]', { hasText: 'Weekly Pulse' });
    await expect(cardTitle).toBeVisible();
    // Check for the colored span in the heading
    const pulseSpan = page.locator('div[data-slot="card-title"] span', { hasText: 'Pulse' });
    await expect(pulseSpan).toBeVisible();

    // Check for the new description
    await expect(page.getByText('Your fun, simple way to check in every week!', { exact: false })).toBeVisible();

    // Check if the Google sign-in button is present and has correct text
    const googleButton = page.getByRole('button', { name: /Sign in with Google/i });
    await expect(googleButton).toBeVisible();

    // Check for the footer note matching company domain email
    const companyDomain = getCompanyDomain();
    await expect(page.getByText(`Please login with your @${companyDomain} email.`, { exact: false })).toBeVisible();
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