import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],

  test: {
    environment: 'jsdom',

    environmentOptions: {
      jsdom: {
        url: 'http://localhost/',
      },
    },

    globals: false,

    setupFiles: ['./src/tests/setup.js'],

    include: [
      'src/tests/**/*.test.{js,jsx}',
    ],

    clearMocks: true,
    restoreMocks: true,

    coverage: {
      provider: 'v8',

      reporter: [
        'text',
        'html',
        'json-summary',
      ],

      reportsDirectory: './coverage',

      include: [
        'src/**/*.{js,jsx}',
      ],

      exclude: [
        'src/tests/**',
        'src/main.jsx',
      ],
    },
  },
})