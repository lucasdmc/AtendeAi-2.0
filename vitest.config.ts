/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    transformMode: {
      web: [/\.[jt]sx?$/]
    },
    jsx: 'react-jsx',
    coverage: {
      reporter: ['text', 'json', 'html', 'lcov', 'xml'],
      reportsDirectory: './reports/coverage',
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        '**/build/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    silent: false,
    reporter: ['verbose', 'json'],
    outputFile: {
      json: './reports/test-results.json'
    }
  },
  define: {
    global: 'globalThis',
  },
});
