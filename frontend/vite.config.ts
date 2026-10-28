import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Material UI and React go in their own chunks so the pages (loaded on demand) stay small and the libraries cache well.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/@mui') || id.includes('node_modules/@emotion')) return 'mui'
          if (id.includes('node_modules/react')) return 'react'
          return undefined
        },
      },
    },
  },
})
