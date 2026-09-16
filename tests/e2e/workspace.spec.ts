import { test, expect, type Page } from '@playwright/test';
async function navigate(page: Page, name: string) {
  const toggle = page.getByRole('button', { name: 'Open navigation', exact: true });
  if (await toggle.isVisible()) await toggle.click();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('button', { name, exact: true })
    .click();
  await expect(page.getByRole('heading', { name, exact: true, level: 1 })).toBeVisible();
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
}
test('completion, filtering, recruiting, grounded answers and reset persist across reloads', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto('/');
  await expect(page.getByText('Saved on this device')).toBeVisible();
  await navigate(page, 'Assignments');
  await page.getByLabel('Course filter').selectOption('ECO');
  await page.getByLabel('Search assignments').fill('elasticity');
  await expect(
    page.getByRole('button', { name: 'Elasticity problem set', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('checkbox', { name: 'Complete Elasticity problem set', exact: true })
    .check();
  await page.reload();
  await expect(
    page.getByRole('checkbox', { name: 'Complete Elasticity problem set', exact: true }),
  ).toBeChecked();
  await page.getByLabel('Status filter').selectOption('Undated');
  await expect(page.getByRole('button', { name: 'Survey proposal', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Trade policy brief', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByRole('button', { name: 'Elasticity problem set', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Brightspace');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await navigate(page, 'Recruiting');
  await page.getByLabel('Stage for Northline Analytics').selectOption('Offer');
  await page.getByLabel('Follow-up for Cinder Works').fill('2026-10-30');
  await page.reload();
  await expect(page.getByLabel('Stage for Northline Analytics')).toHaveValue('Offer');
  await expect(page.getByLabel('Follow-up for Cinder Works')).toHaveValue('2026-10-30');
  await navigate(page, 'Ask');
  for (const title of [
    'Required purchases',
    'Optional purchases',
    'Already online',
    'Platform access fees',
    'Needs confirmation',
  ])
    await expect(page.getByRole('heading', { name: new RegExp(title) })).toBeVisible();
  await page.getByLabel('Ask Command Center').fill('What is due this week');
  await page.getByRole('button', { name: 'Submit question' }).click();
  await expect(page.locator('.answer')).not.toContainText('Elasticity problem set');
  await page.getByLabel('Ask Command Center').fill('What is my next interview');
  await page.getByRole('button', { name: 'Submit question' }).click();
  await expect(page.getByRole('heading', { name: 'No interview recorded' })).toBeVisible();
  await page.getByLabel('Ask Command Center').fill('What is my GPA');
  await page.getByRole('button', { name: 'Submit question' }).click();
  await expect(page.getByRole('heading', { name: 'Not in the available records' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo data', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Reset demo data', exact: true })
    .click();
  await navigate(page, 'Assignments');
  await expect(
    page.getByRole('checkbox', { name: 'Complete Elasticity problem set', exact: true }),
  ).not.toBeChecked();
  await navigate(page, 'Recruiting');
  await expect(page.getByLabel('Stage for Northline Analytics')).toHaveValue('Interview');
  expect(errors).toEqual([]);
});
test('course details, source registry, calendar and keyboard access', async ({ page }) => {
  await page.goto('/');
  await navigate(page, 'Courses');
  await page.getByRole('button', { name: /PHI 240 Ethics/ }).click();
  await expect(page.getByRole('heading', { name: 'Ethics & Public Life' })).toBeVisible();
  await expect(page.getByText('Attendance', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'View source', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Source note');
  await page.getByRole('button', { name: 'Close details' }).click();
  await navigate(page, 'Sources');
  await page.getByLabel('Search sources').fill('LIT');
  await page.getByRole('button', { name: 'LIT 205 course record' }).click();
  await expect(page.getByRole('dialog')).toContainText('Anthology access is unconfirmed');
  await page.keyboard.press('Escape');
  await navigate(page, 'Schedule');
  await page.getByRole('button', { name: 'Next week', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Oct 26 – Nov 1', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'This week', exact: true }).click();
  await page.getByLabel('Event type').selectOption('Interview');
  await expect(page.locator('.calendar-event')).toHaveCount(1);
  await page.locator('.calendar-event').click();
  await expect(page.getByRole('dialog')).toContainText('Northline Analytics');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Control+k');
  await expect(page.getByLabel('Ask Command Center')).toBeFocused();
  await page.getByLabel('Ask Command Center').blur();
  await page.keyboard.press('/');
  await expect(page.getByLabel('Search assignments')).toBeFocused();
});
for (const size of [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
])
  test(`all views fit ${size.width} by ${size.height}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    await page.setViewportSize(size);
    await page.goto('/');
    await expect(page.getByText('Saved on this device')).toBeAttached();
    for (const view of [
      'Today',
      'Assignments',
      'Schedule',
      'Courses',
      'Recruiting',
      'Ask',
      'Sources',
    ]) {
      await navigate(page, view);
      await noOverflow(page);
      expect(await page.locator('main').innerText()).not.toContain('—');
    }
    await navigate(page, 'Assignments');
    await page.getByLabel('Search assignments').fill('nonexistent work');
    await expect(page.getByRole('heading', { name: 'No assignments here' })).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await page.getByRole('button', { name: 'Elasticity problem set', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await noOverflow(page);
    await page.getByRole('button', { name: 'Close details' }).click();
    await navigate(page, 'Today');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.mouse.move(0, 0);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await page.screenshot({ path: `docs/screenshots/today-${size.width}.png`, fullPage: true });
    if (size.width === 1440) {
      for (const view of ['Assignments', 'Schedule', 'Courses', 'Recruiting', 'Ask', 'Sources']) {
        await navigate(page, view);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.mouse.move(0, 0);
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            ),
        );
        await page.screenshot({
          path: `docs/screenshots/${view.toLowerCase()}.png`,
          fullPage: true,
        });
      }
    }
    expect(errors).toEqual([]);
  });
test('corrupt saved data shows a recoverable error', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('command-center-demo-v1', 'broken-json'));
  await page.reload();
  await expect(page.locator('main').getByRole('alert')).toContainText(
    'Saved data could not be read',
  );
  await page
    .locator('main')
    .getByRole('alert')
    .getByRole('button', { name: 'Reset demo data' })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Reset demo data', exact: true })
    .click();
  await expect(page.locator('main').getByRole('alert')).not.toBeVisible();
});

test('mobile edits, Ask input and drawer focus work', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await navigate(page, 'Assignments');
  await page.getByLabel('Search assignments').fill('elasticity');
  await page.getByRole('button', { name: 'Elasticity problem set', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Mark complete', exact: true })
    .click();
  await page.getByRole('button', { name: 'Close details' }).click();
  await navigate(page, 'Ask');
  await page.getByLabel('Ask Command Center').fill('What is due this week');
  await page.getByRole('button', { name: 'Submit question' }).click();
  await expect(page.locator('.answer')).not.toContainText('Elasticity problem set');
  await noOverflow(page);
  await navigate(page, 'Recruiting');
  await page.getByRole('button', { name: 'Cinder Works', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('combobox', { name: 'Stage', exact: true })
    .selectOption('Closed');
  await page.getByRole('button', { name: 'Close details' }).click();
  await page.reload();
  await expect(page.getByLabel('Stage for Cinder Works')).toHaveValue('Closed');
});
