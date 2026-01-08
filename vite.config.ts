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
    },
  },
  // Explicitly embed environment variables in the build
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
      process.env.VITE_API_BASE_URL || 'https://autoteile-bot-service-production.up.railway.app'
    ),
    'import.meta.env.VITE_WAWI_API_TOKEN': JSON.stringify(
      process.env.VITE_WAWI_API_TOKEN || ''
    ),
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
  },
})
