<script setup lang="ts">
import { createRecipe, deleteRecipe, listRecipes, updateRecipe, type RecipePayload } from '@/api/content'
import PageHeader from '@/components/PageHeader.vue'
import type { Recipe } from '@/types'
import { Delete, Edit } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const loading = ref(false)
const submitting = ref(false)
const list = ref<Recipe[]>([])
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

const emptyForm = (): RecipePayload => ({
  name: '',
  mealType: '推荐套餐',
  ageRange: '8-10',
  content: '',
  enabled: true,
})

const form = reactive<RecipePayload>(emptyForm())
const rules: FormRules<RecipePayload> = {
  name: [{ required: true, message: '请输入食谱名称', trigger: 'blur' }],
  mealType: [{ required: true, message: '请输入餐次', trigger: 'blur' }],
  ageRange: [{ required: true, message: '请输入适用月龄', trigger: 'blur' }],
}

async function loadList() {
  loading.value = true
  try {
    list.value = await listRecipes()
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

function openEdit(row: Recipe) {
  dialogMode.value = 'edit'
  editingId.value = row.id
  Object.assign(form, {
    name: row.name,
    mealType: row.mealType,
    ageRange: row.ageRange,
    content: row.content,
    enabled: row.enabled,
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    if (dialogMode.value === 'create') {
      await createRecipe({ ...form })
      ElMessage.success('已新增食谱')
    } else {
      await updateRecipe(editingId.value, { ...form })
      ElMessage.success('已保存食谱')
    }
    dialogVisible.value = false
    await loadList()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row: Recipe) {
  try {
    await ElMessageBox.confirm(`确认删除「${row.name}」？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await deleteRecipe(row.id)
    ElMessage.success('已删除食谱')
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
    <PageHeader title="食谱管理" description="维护首页随机推荐套餐。适用月龄需与小程序档位一致（6-8 / 8-10 等）；做法说明可写 JSON：{foods,seasonings,stars}。云端暂无对应月龄时回退本地兜底。">
      <el-button type="primary" @click="openCreate">新增食谱</el-button>
    </PageHeader>
    <section class="page-card table-wrap" v-loading="loading">
      <el-table :data="list" empty-text="暂无食谱，集合为空时不会展示假数据">
        <el-table-column prop="name" label="食谱名称" min-width="160" />
        <el-table-column prop="mealType" label="餐次" width="100" />
        <el-table-column prop="ageRange" label="适用月龄" width="140" />
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

    <el-dialog v-model="dialogVisible" :title="dialogMode === 'create' ? '新增食谱' : '编辑食谱'" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="88px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" maxlength="40" />
        </el-form-item>
        <el-form-item label="餐次" prop="mealType">
          <el-input v-model="form.mealType" maxlength="20" placeholder="推荐套餐 / 午餐" />
        </el-form-item>
        <el-form-item label="适用月龄" prop="ageRange">
          <el-select v-model="form.ageRange" placeholder="请选择月龄档" style="width: 100%">
            <el-option v-for="item in ageOptions" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="做法说明" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="6"
            placeholder='推荐套餐可填 JSON：{"foods":[{"emoji":"🥩","name":"牛肉泥"}],"seasonings":[],"stars":5}'
          />
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
</style>
