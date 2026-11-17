import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],

    // GitHub Pages hosts project sites under /repository-name/.
    // Locally, the application runs from the root.
    base: process.env.GITHUB_ACTIONS ? '/country-quiz/' : '/',

    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './src/test/setup.ts',
        css: true,
    },
});
