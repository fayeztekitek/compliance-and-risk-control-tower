import fs from 'fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'
import { visualizer } from "rollup-plugin-visualizer";
function blockMockDataPlugin(): import('vite').Plugin {
  return {
    name: 'block-mock-data',
    buildStart() {
      const isProd = process.env.NODE_ENV === 'production'
      if (!isProd) return

      const pagesDir = path.resolve(__dirname, 'src', 'pages')
      const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('Page.tsx'))
      for (const file of files) {
        const absPath = path.join(pagesDir, file)
        const content = fs.readFileSync(absPath, 'utf-8')
        if (content.includes('mockDashboardData')) {
          this.error(
            `Production build blocked: ${file} imports from mockDashboardData. ` +
            'Remove mock data imports before building for production.'
          )
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    blockMockDataPlugin(),
    ...(process.env.NODE_ENV === "production"
      ? [visualizer({ filename: "dist/stats.html", open: false, gzipSize: true })]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
