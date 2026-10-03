import { test, expect } from '@playwright/test';
const category = {
  id: 'bifold',
  name: 'Bifolds',
  createdAt: '2026-01-01T00:00:00Z',
};
async function expectNoOverflow(page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

async function mockAdmin(page, role = 'admin') {
  let categories = [category];
  let signedIn = false;
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/auth/login') {
      signedIn = true;
      return route.fulfill({
        json: { role, user: { role, email: 'admin@example.com' } },
      });
    }
    if (path === '/api/auth/refresh')
      return route.fulfill({
        status: 401,
        json: { message: 'Session expired' },
      });
    if (path === '/api/products') return route.fulfill({ json: [] });
    if (path === '/api/auth/me')
      return route.fulfill({
        status: signedIn ? 200 : 401,
        json: { role, email: 'admin@example.com' },
      });
    if (path === '/api/auth/logout')
      return route.fulfill({ json: { message: 'Signed out' } });
    if (request.method() === 'GET') return route.fulfill({ json: categories });
    if (request.method() === 'POST') {
      const newCategory = {
        id: 'new-category',
        name: request.postDataJSON().name,
        createdAt: '2026-01-02T00:00:00Z',
      };
      categories = [newCategory, ...categories];
      return route.fulfill({ status: 201, json: newCategory });
    }
    if (request.method() === 'PATCH') {
      const updated = {
        ...categories.find((item) => path.endsWith(item.id)),
        name: request.postDataJSON().name,
      };
      categories = categories.map((item) =>
        item.id === updated.id ? updated : item,
      );
      return route.fulfill({ json: updated });
    }
    categories = categories.filter((item) => !path.endsWith(item.id));
    return route.fulfill({ status: 204 });
  });
}

async function signIn(page) {
  await page.goto('/admin');
  await page.getByLabel('Email address').fill('admin@example.com');
  await page.getByLabel('Password', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

test('admin can create, rename, search, and delete a category', async ({
  page,
}) => {
  await mockAdmin(page);
  await signIn(page);
  await page.getByRole('button', { name: 'Categories', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Categories.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Add category', exact: true }).click();
  await page.getByLabel('Category name').fill('  Travel essentials  ');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Add category', exact: true })
    .click();
  await expect(
    page.getByRole('cell', { name: 'Travel essentials', exact: true }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Edit Travel essentials' }).click();
  await page.getByLabel('Category name').fill('Travel wallets');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('Search categories').fill('travel');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.screenshot({
    path: `test-results/admin-${test.info().project.name}.png`,
    fullPage: true,
  });
  await expectNoOverflow(page);

  await page.getByRole('button', { name: 'Delete Travel wallets' }).click();
  await page.getByRole('button', { name: 'Keep category' }).click();
  await expect(
    page.getByRole('cell', { name: 'Travel wallets', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Delete Travel wallets' }).click();
  await page
    .getByRole('button', { name: 'Delete category', exact: true })
    .click();
  await expect(page.getByText('No matching categories.')).toBeVisible();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(
    page.getByRole('heading', { name: 'Welcome back.' }),
  ).toBeVisible();
});

test('admin validates duplicate names and handles expired sessions', async ({
  page,
}) => {
  await mockAdmin(page);
  await signIn(page);
  await page.getByRole('button', { name: 'Categories', exact: true }).click();
  await page.getByRole('button', { name: 'Add category', exact: true }).click();
  await page.getByLabel('Category name').fill('bifolds');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Add category', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText('already exists');
  await page.getByLabel('Category name').fill('New category');
  await page.route('**/api/category', (route) =>
    route.fulfill({
      status: 401,
      json: { message: 'Session expired. Please sign in again.' },
    }),
  );
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Add category', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Welcome back.' }),
  ).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Session expired');
});

test('ordinary accounts cannot open category management', async ({ page }) => {
  await mockAdmin(page, 'user');
  await signIn(page);
  await expect(page.getByRole('alert')).toContainText(
    'does not have administrator access',
  );
  await expect(page.getByRole('button', { name: 'Add category' })).toHaveCount(
    0,
  );
});
