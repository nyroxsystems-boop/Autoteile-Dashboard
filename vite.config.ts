/// <reference types="vitest" />
import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic', // Use modern automatic runtime
    }),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
      // Alias common UI components
      '@partsunion/ui': path.resolve(__dirname, '../packages/ui/src'),
    },
  },
  // Explicitly embed environment variables in the build
  // NOTE: Only non-secret config here! API tokens must NOT be in the bundle.
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
      process.env.VITE_API_BASE_URL || ''
    ),
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: ['e2e/**', 'node_modules/**'],
    css: true,
  },
})
