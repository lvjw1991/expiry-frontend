<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login, saveAuth } from '../api/auth'

const router = useRouter()
const loading = ref(false)
const form = reactive({
  username: '',
  password: ''
})

async function submit() {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  loading.value = true
  try {
    const result = await login(form.username, form.password)
    if (!result?.token) {
      throw new Error('登录接口未返回 token')
    }

    saveAuth({
      ...result,
      username: result.username || form.username
    }, 'pc')

    ElMessage.success('登录成功')
    router.replace('/receiving-orders')
  } catch (e: any) {
    ElMessage.error(e.message || '用户名或密码错误')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <el-card class="login-card" shadow="always">
      <div class="login-logo">有效期管理系统</div>
      <div class="login-subtitle">Inventory Expiry Management</div>

      <el-form :model="form" @keyup.enter="submit">
        <el-form-item>
          <el-input v-model="form.username" size="large" placeholder="用户名" clearable />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" size="large" type="password" placeholder="密码" show-password />
        </el-form-item>
        <el-button type="primary" size="large" class="login-button" :loading="loading" @click="submit">
          登录
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>
