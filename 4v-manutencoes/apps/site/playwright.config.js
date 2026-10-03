import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  fullyParallel: true,
  use: {
    ...devices['Pixel 7'],
    viewport: { width: 390, height: 844 },
    baseURL: 'http://localhost:8789',
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  // Cloudflare's own Pages server: same .html handling, _headers and 404 behaviour as production.
  webServer: { command: 'npx wrangler pages dev dist --port 8789', port: 8789, reuseExistingServer: true, timeout: 120_000 },
});
