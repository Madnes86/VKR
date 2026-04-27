import { expect, test } from '@playwright/test';

test('/test renders space background with nebula and graph canvas overlay', async ({ page }) => {
	await page.goto('/test');
	await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
	await expect(page.locator('.nebula')).toHaveCount(1);
	await expect(page.locator('canvas[aria-hidden="true"]')).toHaveCount(2);
});
