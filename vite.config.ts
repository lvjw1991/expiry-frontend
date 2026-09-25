import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    base: env.VITE_BASE_PATH || '/',
    plugins: [vue(), basicSsl()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      https: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8080/ia',
          changeOrigin: true
        },
        '/ia': {
          target: 'http://localhost:8080',
          changeOrigin: true
        }
      }
    }
  }
})
