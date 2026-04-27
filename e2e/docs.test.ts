import { expect, test } from '@playwright/test';

test('docs page renders hero, TOC and all sections', async ({ page }) => {
	await page.goto('/docs');

	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

	const ids = ['start', 'diagram', 'components', 'ai', 'account', 'bug'];
	for (const id of ids) {
		await expect(page.locator(`#${id}`)).toBeVisible();
		await expect(page.locator(`a[href="#${id}"]`).first()).toBeVisible();
	}
});

test('docs TOC anchors scroll to corresponding sections', async ({ page }) => {
	await page.goto('/docs');
	await page.locator('a[href="#components"]').first().click();
	await expect(page).toHaveURL(/#components$/);
	await expect(page.locator('#components')).toBeInViewport();
});
