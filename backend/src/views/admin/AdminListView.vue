<script setup lang="ts">
import PageHeader from '@/components/PageHeader.vue'
import { useAuthStore } from '@/stores/auth'
import { computed } from 'vue'

const auth = useAuthStore()
const rows = computed(() => (auth.user ? [auth.user] : []))
</script>

<template>
  <div>
    <PageHeader title="管理员管理" description="账号由云函数环境变量校验，不在前端写死密码。当前仅展示已登录管理员，不提供伪造的其他账号。" />
    <section class="page-card table-wrap">
      <el-table :data="rows" empty-text="未登录">
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="displayName" label="显示名" />
        <el-table-column prop="role" label="角色" />
      </el-table>
    </section>
    <el-alert
      class="hint"
      title="如需修改账号密码，请到微信云开发控制台更新云函数 adminApi 的 ADMIN_USERNAME / ADMIN_PASSWORD / ADMIN_TOKEN_SECRET，然后重新部署。"
      type="info"
      :closable="false"
      show-icon
    />
  </div>
</template>

<style scoped>
.table-wrap {
  padding: 12px 16px 16px;
  margin-bottom: 12px;
}

.hint {
  max-width: 880px;
}
</style>
