import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ensure proper asset handling in production
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Keep images in root for easier access
          if (assetInfo.name && /\.(png|jpe?g|gif|svg|ico)$/i.test(assetInfo.name)) {
            return '[name].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        }
      }
    }
  },
  // Ensure public directory is properly served
  publicDir: 'public',
  base: '/'
})
