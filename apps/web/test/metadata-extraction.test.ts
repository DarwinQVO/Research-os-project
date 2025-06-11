import { test, expect } from '@playwright/test';

test.describe('Metadata Extraction', () => {
  test('should extract metadata from URL when adding source', async ({ page }) => {
    // Navigate to a report page
    await page.goto('/reports/test-report-id');
    
    // Click on Add Source button
    await page.click('button:has-text("Add Source")');
    
    // Enter a URL
    await page.fill('input[type="url"]', 'https://example.com/article');
    
    // Wait for metadata to load
    await page.waitForSelector('.border.rounded-lg.p-4', { timeout: 5000 });
    
    // Check that metadata is displayed
    const metadataContainer = page.locator('.border.rounded-lg.p-4');
    await expect(metadataContainer).toBeVisible();
    
    // Submit the form
    await page.click('button:has-text("Add Source")');
    
    // Check that the source was added
    await expect(page.locator('text="example.com"')).toBeVisible();
  });
  
  test('should show loading state while fetching metadata', async ({ page }) => {
    await page.goto('/reports/test-report-id');
    
    // Click on Add Source button
    await page.click('button:has-text("Add Source")');
    
    // Enter a URL
    await page.fill('input[type="url"]', 'https://example.com/slow-loading');
    
    // Check for loading spinner
    await expect(page.locator('.animate-spin')).toBeVisible();
  });
  
  test('should handle invalid URLs gracefully', async ({ page }) => {
    await page.goto('/reports/test-report-id');
    
    // Click on Add Source button
    await page.click('button:has-text("Add Source")');
    
    // Enter an invalid URL
    await page.fill('input[type="url"]', 'not-a-valid-url');
    
    // Try to submit
    await page.click('button[type="submit"]:has-text("Add Source")');
    
    // Check for error message
    await expect(page.locator('text="Please enter a valid URL"')).toBeVisible();
  });
  
  test('should display different icons for different source types', async ({ page }) => {
    await page.goto('/reports/test-report-id');
    
    // Add a video source
    await page.click('button:has-text("Add Source")');
    await page.fill('input[type="url"]', 'https://youtube.com/watch?v=test');
    await page.waitForSelector('.border.rounded-lg.p-4');
    
    // Check for video icon
    const videoIcon = page.locator('svg.h-4.w-4').first();
    await expect(videoIcon).toBeVisible();
    
    await page.click('button[type="submit"]:has-text("Add Source")');
    
    // Wait for dialog to close
    await page.waitForSelector('dialog', { state: 'hidden' });
    
    // Check that the video icon is shown in the sources list
    await expect(page.locator('.border.rounded-lg svg.h-4.w-4')).toBeVisible();
  });
});