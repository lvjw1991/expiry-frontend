import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  // 打包后要放进 Spring Boot 的 server.servlet.context-path=/ia 下，
  // 所以静态资源（JS/CSS）和路由都要以 /ia/ 为前缀，否则线上会 404 / 白屏
  base: '/ia/',
  plugins: [vue(), basicSsl()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: true,
    proxy: {
      // 前端代码里请求的是 /ia/api/xxx（跟生产环境保持一致），开发时转发到本地后端的 /ia/api/xxx
      '/ia/api': {
        target: 'http://localhost:443',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
