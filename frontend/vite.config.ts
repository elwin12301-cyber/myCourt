import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// React gets its own cached chunk; the screens are loaded on demand (see App.tsx).
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('node_modules/react') ? 'react' : undefined),
      },
    },
  },
})
