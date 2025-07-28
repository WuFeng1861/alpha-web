import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  esbuild: {
    // drop: ['console', 'debugger'], // 移除所有 console 和 debugger
  },
})
