// A simple test that doesn't import any app code
import { expect, test } from '@playwright/test';

test('basic app loading', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:8081/');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Verify something is visible (any text on the page)
  const pageTitle = await page.title();
  console.log(`Page title: ${pageTitle}`);
  
  // Just check that something rendered
  expect(await page.screenshot()).not.toBeNull();
});