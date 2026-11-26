import base from './playwright.config';
import { defineConfig } from '@playwright/test';

/** Report-only audits (`npm run audit:contrast`); kept out of `npm run test:e2e` and CI. */
export default defineConfig({ ...base, testMatch: '**/*.audit.ts', reporter: 'list', workers: 1 });
