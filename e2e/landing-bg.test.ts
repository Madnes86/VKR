import { expect, test } from '@playwright/test';

test('landing renders space + graph backgrounds and the demo canvas', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
	await expect(page.locator('.nebula')).toHaveCount(1);
	await expect(page.locator('canvas')).toHaveCount(2);
	await expect(page.getByText('Service', { exact: true }).first()).toBeVisible();
	await expect(page.getByText('Gateway', { exact: true }).first()).toBeVisible();
});
