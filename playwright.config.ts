import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import {set} from 'lodash';

// Read and set environment variables
const envPath = path.resolve(process.cwd(), '.env.test.local');
const envLocal = fs.readFileSync(envPath).toString();
const envConfig = dotenv.parse(envLocal);

set(global, 'test.env', envConfig);

// Set each environment variable
Object.entries(envConfig).forEach(([key, value]) => {
    process.env[key] = value;
});

export default defineConfig({
    testDir: 'src/__tests__/e2e',
    globalSetup: require.resolve('./src/__tests__/e2e/setup.ts'),
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: process.env.EXPO_PUBLIC_APP_URL || 'http://localhost:8081',
        trace: 'on-first-retry',
        // Add slow motion for visual debugging
        launchOptions: {
            slowMo: 300
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