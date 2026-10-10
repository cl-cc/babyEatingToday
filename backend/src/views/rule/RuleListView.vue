<script setup lang="ts">
import { createRule, deleteRule, listRules, updateRule, type RulePayload } from '@/api/content'
import PageHeader from '@/components/PageHeader.vue'
import type { RecommendRule } from '@/types'
import { Delete, Edit, Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const loading = ref(false)
const submitting = ref(false)
const list = ref<RecommendRule[]>([])
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const editingId = ref('')
const formRef = ref<FormInstance>()

const ageOptions = [
  { id: '6-8', label: '6-8个月' },
  { id: '8-10', label: '8-10个月' },
  { id: '10-12', label: '10-12个月' },
  { id: '1-2', label: '1-2岁' },
  { id: '2-3', label: '2-3岁' },
  { id: '4-5', label: '4-5岁' },
  { id: '6-7', label: '6-7岁' },
]

const emptyPortions = () => ({
  meat: '',
  veg: '',
  fruit: '',
  grain: '',
  default: '',
})

const emptyForm = (): RulePayload => ({
  ageId: '8-10',
  title: '',
  content: '',
  seasonings: [{ name: '', amount: '' }],
  portions: emptyPortions(),
  enabled: true,
})

const form = reactive<RulePayload>(emptyForm())
const rules: FormRules<RulePayload> = {
  ageId: [{ required: true, message: '请输入月龄档', trigger: 'blur' }],
  title: [{ required: true, message: '请输入规则摘要', trigger: 'blur' }],
}

async function loadList() {
  loading.value = true
  try {
    list.value = await listRules()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '加载失败')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  dialogMode.value = 'create'
  editingId.value = ''
  Object.assign(form, emptyForm())
  dialogVisible.value = true
}

function openEdit(row: RecommendRule) {
  dialogMode.value = 'edit'
  editingId.value = row.id
  Object.assign(form, {
    ageId: row.ageId,
    title: row.title,
    content: row.content,
    seasonings: row.seasonings && row.seasonings.length ? row.seasonings.map((item) => ({ ...item })) : [{ name: '', amount: '' }],
    portions: { ...emptyPortions(), ...(row.portions || {}) },
    enabled: row.enabled,
  })
  dialogVisible.value = true
}

function addSeasoning() {
  form.seasonings.push({ name: '', amount: '' })
}

function removeSeasoning(index: number) {
  form.seasonings.splice(index, 1)
  if (!form.seasonings.length) form.seasonings.push({ name: '', amount: '' })
}

function toPayload(): RulePayload {
  return {
    ...form,
    seasonings: form.seasonings.filter((item) => item.name.trim()),
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const payload = toPayload()
    if (dialogMode.value === 'create') {
      await createRule(payload)
      ElMessage.success('已新增规则')
    } else {
      await updateRule(editingId.value, payload)
      ElMessage.success('已保存规则')
    }
    dialogVisible.value = false
    await loadList()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row: RecommendRule) {
  try {
    await ElMessageBox.confirm(`确认删除「${row.title}」？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await deleteRule(row.id)
    ElMessage.success('已删除规则')
    await loadList()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error instanceof Error ? error.message : '删除失败')
  }
}

onMounted(() => {
  void loadList()
})
</script>

<template>
  <div>
    <PageHeader title="推荐规则" description="按月龄维护调味说明、默认调料用量和推荐克重。小程序今日推荐、搭配、能不能吃会读取这里；云端暂无对应月龄时回退本地兜底。">
      <el-button type="primary" @click="openCreate">新增规则</el-button>
    </PageHeader>
    <section class="page-card table-wrap" v-loading="loading">
      <el-table :data="list" empty-text="暂无规则，集合为空时不会展示假数据">
        <el-table-column prop="ageId" label="月龄档" width="120" />
        <el-table-column prop="title" label="规则摘要" min-width="180" />
        <el-table-column prop="content" label="规则说明" min-width="260" show-overflow-tooltip />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" min-width="180" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Edit" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="dialogVisible" :title="dialogMode === 'create' ? '新增规则' : '编辑规则'" width="640px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="88px">
        <el-form-item label="月龄档" prop="ageId">
          <el-select v-model="form.ageId" placeholder="请选择月龄档" style="width: 100%">
            <el-option v-for="item in ageOptions" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="规则摘要" prop="title">
          <el-input v-model="form.title" maxlength="80" />
        </el-form-item>
        <el-form-item label="规则说明" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="默认调料">
          <div class="seasoning-list">
            <div v-for="(item, index) in form.seasonings" :key="index" class="seasoning-row">
              <el-input v-model="item.name" placeholder="调料名" />
              <el-input v-model="item.amount" placeholder="用量说明" />
              <el-button link type="danger" :icon="Delete" @click="removeSeasoning(index)" />
            </div>
            <el-button :icon="Plus" @click="addSeasoning">添加调料</el-button>
          </div>
        </el-form-item>
        <el-form-item label="推荐克重">
          <div class="portion-grid">
            <el-input v-model="form.portions.meat" placeholder="肉类，如 15g" />
            <el-input v-model="form.portions.veg" placeholder="蔬菜，如 20g" />
            <el-input v-model="form.portions.fruit" placeholder="水果，如 20g" />
            <el-input v-model="form.portions.grain" placeholder="主食，如 25g" />
            <el-input v-model="form.portions.default" placeholder="默认，如 20g" />
          </div>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.table-wrap {
  padding: 12px 16px 16px;
}

.seasoning-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.seasoning-row {
  display: grid;
  grid-template-columns: 1fr 1.4fr auto;
  gap: 8px;
  align-items: center;
}

.portion-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  width: 100%;
}
</style>
