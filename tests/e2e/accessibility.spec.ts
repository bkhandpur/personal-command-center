import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('core views meet automated WCAG AA checks', async ({ page }) => {
  await page.goto('/');
  for (const view of [
    'Today',
    'Assignments',
    'Schedule',
    'Courses',
    'Recruiting',
    'Ask',
    'Sources',
  ]) {
    await page.getByRole('navigation').getByRole('button', { name: view, exact: true }).click();
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(result.violations, `${view} accessibility violations`).toEqual([]);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(result.violations).toEqual([]);
});
