<script setup lang="ts">
import { listLogs } from '@/api/content'
import PageHeader from '@/components/PageHeader.vue'
import type { OperationLog } from '@/types'
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'

const loading = ref(false)
const list = ref<OperationLog[]>([])

function formatTime(value: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

onMounted(async () => {
  loading.value = true
  try {
    list.value = await listLogs()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '加载失败')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <PageHeader title="操作日志" description="记录后台对食材、分类及其他内容库的真实变更，写入 admin_logs 集合。" />
    <section class="page-card table-wrap" v-loading="loading">
      <el-table :data="list" empty-text="暂无日志">
        <el-table-column label="时间" min-width="180">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column prop="operator" label="操作人" width="140" />
        <el-table-column prop="action" label="动作" width="120" />
        <el-table-column prop="target" label="对象" min-width="160" />
      </el-table>
    </section>
  </div>
</template>

<style scoped>
.table-wrap {
  padding: 12px 16px 16px;
}
</style>
