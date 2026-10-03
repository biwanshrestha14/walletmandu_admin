import { defineConfig } from '@playwright/test';
const port = process.env.TEST_PORT || '5174';
export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: `http://localhost:${port}`,
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  },
  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
  },
});
