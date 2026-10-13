import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './styles.css'
import App from './App.vue'
import router from './router'

createApp(App).use(router).use(ElementPlus).mount('#app')


// v0.7.42: suppress browser zoom gestures on the mobile app.
// Normal single-finger scrolling and form interactions remain available.
if (typeof document !== 'undefined') {
  document.addEventListener('gesturestart', (event) => event.preventDefault(), { passive: false } as AddEventListenerOptions)
  document.addEventListener('gesturechange', (event) => event.preventDefault(), { passive: false } as AddEventListenerOptions)
  document.addEventListener('gestureend', (event) => event.preventDefault(), { passive: false } as AddEventListenerOptions)

  let lastTouchEnd = 0
  document.addEventListener('touchend', (event) => {
    const now = Date.now()
    if (now - lastTouchEnd <= 300) event.preventDefault()
    lastTouchEnd = now
  }, { passive: false } as AddEventListenerOptions)

  document.addEventListener('dblclick', (event) => event.preventDefault(), { passive: false } as AddEventListenerOptions)
}
