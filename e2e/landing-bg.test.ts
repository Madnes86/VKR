import { expect, test } from '@playwright/test';

test('/test renders graph background canvas behind landing content', async ({ page }) => {
	await page.goto('/test');
	await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
	const canvas = page.locator('canvas[aria-hidden="true"]');
	await expect(canvas).toHaveCount(1);
	await expect(canvas).toBeAttached();
});

test('/test2 renders space background with nebula and stars canvas', async ({ page }) => {
	await page.goto('/test2');
	await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
	await expect(page.locator('.nebula')).toHaveCount(1);
	await expect(page.locator('canvas[aria-hidden="true"]')).toHaveCount(1);
});
