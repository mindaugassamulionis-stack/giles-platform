import path from 'path';
import { defineConfig } from 'vitest/config';

// Unit tests for pure BGB §356a logic (geo-detection + cancellation content).
// Framework/UI (server components, middleware) are verified via next build + E2E.
export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@platform/database': path.resolve(__dirname, 'packages/database/src'),
            '@platform/i18n': path.resolve(__dirname, 'packages/i18n/src'),
        },
    },
    test: {
        globals: true,
        environment: 'node',
        include: ['src/lib/**/*.test.ts'],
    },
});
