import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // React Compiler (babel) đã bị xoá: chiếm 71% build time, chưa stable với React 19.
    // @vitejs/plugin-react dùng esbuild mặc định — nhanh hơn nhiều.
    react(),

    // Chỉ chạy khi build production, bỏ qua webp đã tối ưu sẵn
    ViteImageOptimizer({
      // WebP đã được tối ưu thủ công → KHÔNG re-optimize (plugin làm tăng size +100~232%)
      exclude: /\.webp$/,
      png: { quality: 80, compressionLevel: 8 },
      jpeg: { quality: 80 },
      jpg: { quality: 80 },
    }),
  ],

  build: {
    // Tăng chunk size warning (dashboard hơi lớn nhưng chấp nhận được)
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Rolldown yêu cầu function, không phải object
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react'
          }
        },
      },
    },
    // Minify CSS tốt hơn
    cssMinify: true,
    // Source map chỉ khi dev
    sourcemap: false,
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/oauth2': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/login/oauth2': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
