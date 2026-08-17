<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Menu, Calendar, List, UserFilled, Shop, Goods } from '@element-plus/icons-vue'
import { logout } from './api/auth'

const route = useRoute()
const router = useRouter()
const collapsed = ref(false)
const username = ref('用户')

const savedUser = window.localStorage.getItem('login_user')
if (savedUser) {
  try { username.value = JSON.parse(savedUser).username || '用户' } catch {}
}

function doLogout() {
  logout()
  router.replace('/login')
}
</script>

<template>
  <!-- 登录页和手机端完全不使用 PC 左侧导航 -->
  <router-view v-if="route.meta.layout !== 'desktop'" />

  <!-- 只有明确标记为 desktop 的路由才使用 PC Layout -->
  <el-container v-else class="app-shell">
    <el-aside :width="collapsed ? '64px' : '220px'" class="sidebar" :class="{ collapsed }">
      <div class="logo">{{ collapsed ? '期' : '有效期管理' }}</div>
      <el-menu :default-active="route.path" :collapse="collapsed" router background-color="#18222c" text-color="#cfd8e3" active-text-color="#409eff">
        <el-menu-item index="/receiving-orders"><el-icon><List /></el-icon><span>来货管理</span></el-menu-item>
        <el-menu-item index="/expiry-records"><el-icon><Calendar /></el-icon><span>有效期管理</span></el-menu-item>
        <el-menu-item index="/suppliers"><el-icon><Shop /></el-icon><span>供应商管理</span></el-menu-item>
        <el-menu-item index="/supplier-products"><el-icon><Goods /></el-icon><span>供应商商品</span></el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <el-button text @click="collapsed = !collapsed"><el-icon><Menu /></el-icon></el-button>
        <div class="header-title">库存有效期管理系统</div>
        <div class="header-user"><el-icon><UserFilled /></el-icon><span>{{ username }}</span><el-button text type="danger" @click="doLogout">退出</el-button></div>
      </el-header>
      <el-main class="main"><router-view /></el-main>
    </el-container>
  </el-container>
</template>
