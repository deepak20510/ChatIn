import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  publicDir: "public",

  build: {
    // Target modern browsers (ES2020+) for smaller bundles
    target: "es2020",
    // Warn when a chunk exceeds 600KB (before gzip)
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        // Manual code splitting — separates vendor libs into cacheable chunks
        manualChunks: {
          // React core — rarely changes, long cache lifetime
          "vendor-react": ["react", "react-dom"],
          // Router
          "vendor-router": ["react-router"],
          // Socket.IO — large and changes infrequently
          "vendor-socket": ["socket.io-client"],
          // Zustand state management
          "vendor-store": ["zustand"],
          // UI libs
          "vendor-ui": ["lucide-react", "react-hot-toast"],
        },
        assetFileNames: (assetInfo) => {
          // Keep images in root for easier access, hash everything else
          if (assetInfo.name && /\.(png|jpe?g|gif|svg|ico|webp)$/i.test(assetInfo.name)) {
            return "[name].[ext]";
          }
          return "assets/[name]-[hash].[ext]";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
      },
    },
  },

  server: {
    // Local dev proxy — avoids CORS issues when backend is on :3000
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:3000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
