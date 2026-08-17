import { createRouter, createWebHistory } from 'vue-router'
import Login from './views/Login.vue'
import ReceivingOrderList from './views/receiving/ReceivingOrderList.vue'
import ReceivingOrderDetail from './views/receiving/ReceivingOrderDetail.vue'
import CheckGoods from './views/receiving/CheckGoods.vue'
import ExpiryRecordList from './views/expiry/ExpiryRecordList.vue'
import ExpiryRecordDetail from './views/expiry/ExpiryRecordDetail.vue'
import SupplierList from './views/supplier/SupplierList.vue'
import SupplierProductList from './views/supplier/SupplierProductList.vue'
import MobileLogin from './views/mobile/MobileLogin.vue'
import MobileCheckOrders from './views/mobile/MobileCheckOrders.vue'
import MobileCheckItems from './views/mobile/MobileCheckItems.vue'
import MobileExpiry from './views/mobile/MobileExpiry.vue'
import MobileExpiryDetail from './views/mobile/MobileExpiryDetail.vue'

const router = createRouter({
  // 和 vite.config.ts 的 base 保持一致，import.meta.env.BASE_URL 会自动等于那个值（这里是 '/ia/'）
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', component: Login, meta: { public: true, platform: 'pc', layout: 'none' } },
    { path: '/m', component: MobileLogin, meta: { public: true, platform: 'mobile', layout: 'mobile-login' } },
    { path: '/m/login', component: MobileLogin, meta: { public: true, platform: 'mobile', layout: 'mobile-login' } },
    { path: '/', redirect: '/receiving-orders' },
    { path: '/receiving-orders', component: ReceivingOrderList, meta: { layout: 'desktop', platform: 'pc', requiresAuth: true } },
    { path: '/receiving-orders/:id', component: ReceivingOrderDetail, props: true, meta: { layout: 'desktop', platform: 'pc', requiresAuth: true } },
    { path: '/receiving-orders/:id/check', component: CheckGoods, props: true, meta: { layout: 'desktop', platform: 'pc', requiresAuth: true } },
    { path: '/expiry-records', component: ExpiryRecordList, meta: { layout: 'desktop', platform: 'pc', requiresAuth: true } },
    { path: '/expiry-records/:id', component: ExpiryRecordDetail, meta: { layout: 'desktop', platform: 'pc', requiresAuth: true } },
    { path: '/suppliers', component: SupplierList, meta: { layout: 'desktop', platform: 'pc', requiresAuth: true } },
    { path: '/supplier-products', component: SupplierProductList, meta: { layout: 'desktop', platform: 'pc', requiresAuth: true } },
    { path: '/m/check', component: MobileCheckOrders, meta: { layout: 'mobile', platform: 'mobile', requiresAuth: true } },
    { path: '/m/check/:id', component: MobileCheckItems, props: true, meta: { layout: 'mobile', platform: 'mobile', requiresAuth: true } },
    { path: '/m/expiry', component: MobileExpiry, meta: { layout: 'mobile', platform: 'mobile', requiresAuth: true } },
    { path: '/m/expiry/:id', component: MobileExpiryDetail, props: true, meta: { layout: 'mobile', platform: 'mobile', requiresAuth: true } }
  ]
})

router.beforeEach((to) => {
  if (to.meta.public) return true

  const platform = to.meta.platform === 'mobile' || to.path.startsWith('/m/') ? 'mobile' : 'pc'
  const token = platform === 'mobile'
    ? window.localStorage.getItem('mobile_access_token')
    : window.localStorage.getItem('access_token')

  if (!token) return platform === 'mobile' ? '/m/login' : '/login'
  return true
})

export default router
