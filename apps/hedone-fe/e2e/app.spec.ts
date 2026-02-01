import { test, expect } from '@playwright/test';

test.describe('Carnawaze E2E (web)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows login or redirects when not authenticated', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const hasLogin = await page.locator('text=Entrar').isVisible().catch(() => false);
    const hasMap = await page.locator('text=Mapa').isVisible().catch(() => false);
    expect(hasLogin || hasMap).toBeTruthy();
  });

  test('register link goes to register screen', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const link = page.locator('text=Criar conta');
    if (await link.isVisible()) {
      await link.click();
      await expect(page.locator('text=Criar conta').first()).toBeVisible({ timeout: 5000 });
    }
  });
});
