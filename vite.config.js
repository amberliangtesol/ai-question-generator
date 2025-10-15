import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [vue()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue', 'vue-router', 'pinia'],
            pdf: ['jspdf', 'html2canvas']
          }
        }
      }
    },
    server: {
      proxy: {
        '/api/openai': {
          target: 'https://api.openai.com/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/openai/, ''),
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              proxyReq.setHeader('Authorization', `Bearer ${env.VITE_OPENAI_API_KEY}`)
            })
          }
        },
        '/api/claude': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/claude/, ''),
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              proxyReq.setHeader('x-api-key', env.VITE_CLAUDE_API_KEY)
              proxyReq.setHeader('anthropic-version', '2023-06-01')
              proxyReq.setHeader('anthropic-dangerous-direct-browser-access', 'true')
            })
          }
        }
      }
    }
  }
})
