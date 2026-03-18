import { test, expect } from '@playwright/test';

test.describe('Dashboard Login Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    // Navigate to the login page
    await page.goto('http://localhost:5173/');

    // Fill the login form
    await page.fill('input[type="text"]', 'admin@partsunion.de');
    await page.fill('input[type="password"]', 'SecurePassword123!');
    
    // Click the login button
    await page.click('button[type="submit"]');

    // Wait for the navigation to the dashboard
    await page.waitForURL('**/bot/heute');

    // Verify successful login by checking for a dashboard element
    await expect(page.locator('text=Hallo, admin')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    // Navigate to the login page
    await page.goto('http://localhost:5173/');

    // Fill the login form with wrong password
    await page.fill('input[type="text"]', 'admin@partsunion.de');
    await page.fill('input[type="password"]', 'wrongpass');
    
    // Click the login button
    await page.click('button[type="submit"]');

    // Verify error message
    const errorMsg = page.locator('.text-red-500').first();
    await expect(errorMsg).toBeVisible();
  });
});
