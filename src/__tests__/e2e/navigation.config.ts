// A separate config file for simple navigation tests that don't require app dependencies
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: path.join(process.cwd(), 'src/__tests__/e2e'),
  testMatch: '**/navigation.test.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on',
    launchOptions: {
      slowMo: 300
    },
    // Add more console logging
    logger: {
      isEnabled: (name) => true,
      log: (name, message) => console.log(`${name}: ${message}`)
    }
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run web',
    port: 8081,
    reuseExistingServer: !process.env.CI,
  },
});