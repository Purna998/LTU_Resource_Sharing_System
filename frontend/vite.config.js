import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react()],
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Split out three.js and react-three related packages (huge)
            if (id.includes('node_modules/three') || id.includes('node_modules/@react-three')) {
              return 'three-vendor';
            }
            // Split out tsparticles (large)
            if (id.includes('node_modules/@tsparticles') || id.includes('node_modules/tsparticles')) {
              return 'particles-vendor';
            }
            // Split React core
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
              return 'react-vendor';
            }
          }
        }
      }
    }
  }
})
