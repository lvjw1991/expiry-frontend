<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
const route = useRoute(); const router = useRouter()
</script>
<template>
  <nav class="mobile-nav">
    <button :class="['mobile-nav-item', { active: route.path.startsWith('/m/check') }]" @click="router.push('/m/check')">📦<span>点货</span></button>
    <button :class="['mobile-nav-item', { active: route.path.startsWith('/m/expiry') }]" @click="router.push('/m/expiry')">📅<span>有效期</span></button>
  </nav>
</template>
