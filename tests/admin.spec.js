import { test, expect } from '@playwright/test';

test('cookie session restores, products upload and category filter reaches API', async ({
  page,
}) => {
  let signedIn = false;
  let uploaded = '';
  let filtered = false;
  const categoryId = '8dce967c-1f4a-4cd2-a3db-826127417f39';
  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    let status = 200;
    let data = {};
    if (url.pathname === '/api/auth/me') {
      status = signedIn ? 200 : 401;
      data = { email: 'admin@example.com', role: 'admin' };
    } else if (url.pathname === '/api/auth/refresh') status = 401;
    else if (url.pathname === '/api/auth/login') {
      signedIn = true;
      data = {
        role: 'admin',
        user: { email: 'admin@example.com', role: 'admin' },
      };
    } else if (url.pathname === '/api/category')
      data = [{ id: categoryId, name: 'Bifolds' }];
    else if (url.pathname === '/api/products' && req.method() === 'POST') {
      uploaded = req.postDataBuffer().toString();
      data = { id: 'product', name: 'Travel wallet' };
    } else if (url.pathname === '/api/products') {
      if (url.searchParams.get('categoryId') === categoryId) filtered = true;
      data = [];
    }
    await route.fulfill({ status, json: data });
  });
  await page.goto('/');
  await page.getByLabel('Email address').fill('admin@example.com');
  await page.getByLabel('Password', { exact: true }).fill('password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Products.' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Products.' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.getByRole('img', { name: 'Add your first product' }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/products-empty-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole('button', { name: 'Create product', exact: true })
    .click();
  await page.screenshot({
    path: `test-results/products-create-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByLabel('Name', { exact: true }).fill('Travel wallet');
  await page.getByLabel('Price (NPR)').fill('1200');
  const image = {
    name: 'wallet.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII=',
      'base64',
    ),
  };
  await page.getByLabel('Cover image', { exact: true }).setInputFiles(image);
  await expect(
    page.getByRole('img', { name: 'Selected photo: wallet.png' }),
  ).toBeVisible();
  await page
    .getByRole('switch', { name: 'Show in landing-page carousel' })
    .check();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Create product', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.getByRole('status').filter({ hasText: 'created successfully' }),
  ).toBeVisible();
  expect(uploaded).toContain('name="featuredimage"');
  expect(uploaded).toContain('Travel wallet');
  await page.getByLabel('Filter by category').selectOption(categoryId);
  await expect.poll(() => filtered).toBe(true);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});

test('existing product can be unfeatured in the editor without uploading an image', async ({
  page,
}) => {
  let product = {
    id: 'wallet',
    name: 'Everyday wallet',
    featuredimage: true,
    price: 100,
    stock: 1,
    isActive: true,
  };
  let patch;
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/me')
      return route.fulfill({
        json: { role: 'admin', email: 'admin@example.com' },
      });
    if (path === '/api/category') return route.fulfill({ json: [] });
    if (route.request().method() === 'PATCH') {
      patch = route.request().postDataJSON();
      product = { ...product, ...patch };
      return route.fulfill({ json: product });
    }
    return route.fulfill({ json: [product] });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Edit Everyday wallet' }).click();
  const toggle = page.getByRole('switch', {
    name: 'Show in landing-page carousel',
  });
  await expect(toggle).toBeChecked();
  await toggle.uncheck();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(patch.featuredimage).toBe(false);
});

test('product details can be edited from the list and failed saves stay open', async ({
  page,
}) => {
  let product = {
    id: 'wallet',
    name: 'Everyday wallet',
    price: 100,
    stock: 2,
    isActive: true,
    featuredimage: false,
  };
  let rejectSave = true;
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/me')
      return route.fulfill({
        json: { role: 'admin', email: 'admin@example.com' },
      });
    if (path === '/api/category') return route.fulfill({ json: [] });
    if (route.request().method() === 'PATCH') {
      if (rejectSave)
        return route.fulfill({
          status: 500,
          json: { message: 'Please retry saving.' },
        });
      product = { ...product, ...route.request().postDataJSON() };
      return route.fulfill({ json: product });
    }
    return route.fulfill({ json: [product] });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Edit Everyday wallet' }).click();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
    'Everyday wallet',
  );
  await page.getByLabel('Name', { exact: true }).fill('Travel wallet');
  await page.getByLabel('Price (NPR)').fill('1500');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
    'Please retry saving.',
  );
  rejectSave = false;
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Edit Travel wallet' }),
  ).toBeVisible();
  expect(product.price).toBe(1500);
  await page
    .getByRole('button', { name: 'Create product', exact: true })
    .click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('deleting a product requires confirmation and failed deletion can be retried', async ({
  page,
}) => {
  const product = {
    id: 'wallet',
    name: 'Everyday wallet',
    price: 100,
    stock: 2,
    isActive: true,
  };
  let deletes = 0;
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/me')
      return route.fulfill({
        json: { role: 'admin', email: 'admin@example.com' },
      });
    if (path === '/api/category') return route.fulfill({ json: [] });
    if (route.request().method() === 'DELETE') {
      expect(path).toBe('/api/products/wallet');
      deletes++;
      if (deletes === 1)
        return route.fulfill({
          status: 500,
          json: { message: 'Unable to delete. Please retry.' },
        });
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({ json: [product] });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Delete Everyday wallet' }).click();
  await expect(page.getByRole('dialog')).toContainText('Everyday wallet');
  await page.getByRole('button', { name: 'Keep product' }).click();
  expect(deletes).toBe(0);
  await expect(
    page.getByRole('button', { name: 'Edit Everyday wallet' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Delete Everyday wallet' }).click();
  await page
    .getByRole('button', { name: 'Delete product', exact: true })
    .click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
    'Unable to delete',
  );
  await page
    .getByRole('button', { name: 'Delete product', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Edit Everyday wallet' }),
  ).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('deleted successfully');
  await expect(
    page.getByRole('heading', { name: 'Your collection starts here.' }),
  ).toBeVisible();
  expect(deletes).toBe(2);
});

test('cover and detail photos appear in the list and editor', async ({
  page,
}) => {
  const photoUrl =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII=';
  const product = {
    id: 'wallet',
    name: 'Travel wallet',
    price: 1200,
    stock: 3,
    isActive: true,
    featuredimage: true,
    coverImageUrl: photoUrl,
    images: [{ id: 'detail', url: photoUrl, position: 0 }],
  };
  await page.route('**/api/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/me')
      return route.fulfill({
        json: { role: 'admin', email: 'admin@example.com' },
      });
    return route.fulfill({ json: path === '/api/category' ? [] : [product] });
  });
  await page.goto('/');
  await expect(
    page.getByRole('img', { name: 'Travel wallet cover image', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('img', {
      name: 'Travel wallet detail image 1',
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/product-photos-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Edit Travel wallet' }).click();
  const dialog = page.getByRole('dialog');
  await expect(
    dialog.getByRole('img', { name: 'Travel wallet cover image', exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByRole('img', {
      name: 'Travel wallet detail image 1',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    dialog.getByRole('link', { name: 'Open Travel wallet cover image' }),
  ).toHaveAttribute('href', photoUrl);
});
