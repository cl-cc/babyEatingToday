<script setup lang="ts">
import { createCategory, deleteCategory, listCategories, updateCategory, type CategoryView } from '@/api/category'
import PageHeader from '@/components/PageHeader.vue'
import type { CategoryPayload } from '@/types'
import { Delete, Edit, Open, TurnOff } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const loading = ref(false)
const submitting = ref(false)
const tableData = ref<CategoryView[]>([])
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const editingId = ref('')
const formRef = ref<FormInstance>()

const emptyForm = (): CategoryPayload => ({
  id: '',
  name: '',
  emoji: '',
  sort: 80,
  enabled: true,
})

const form = reactive<CategoryPayload>(emptyForm())

const rules: FormRules<CategoryPayload> = {
  id: [{ required: true, message: '请输入分类 ID', trigger: 'blur' }],
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
}

async function loadList() {
  loading.value = true
  try {
    tableData.value = await listCategories()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '分类加载失败')
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

function openEdit(row: CategoryView) {
  dialogMode.value = 'edit'
  editingId.value = row.id
  Object.assign(form, {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    sort: row.sort,
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
      await createCategory({ ...form })
      ElMessage.success('已新增分类')
    } else {
      await updateCategory(editingId.value, { ...form })
      ElMessage.success('已保存分类')
    }
    dialogVisible.value = false
    await loadList()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败')
  } finally {
    submitting.value = false
  }
}

async function handleToggle(row: CategoryView) {
  try {
    await updateCategory(row.id, {
      id: row.id,
      name: row.name,
      emoji: row.emoji,
      sort: row.sort,
      enabled: !row.enabled,
    })
    ElMessage.success(row.enabled ? '已停用分类' : '已启用分类')
    await loadList()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '状态更新失败')
  }
}

async function handleDelete(row: CategoryView) {
  try {
    await ElMessageBox.confirm(
      row.foodCount > 0
        ? `「${row.name}」下仍有 ${row.foodCount} 个食材，无法删除。`
        : `确认删除分类「${row.name}」？系统预置分类不可删除。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消' },
    )
    await deleteCategory(row.id)
    ElMessage.success('已删除分类')
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
    <PageHeader title="分类管理" description="分类 ID 兼容小程序现有 categoryId。grain / veg / fruit / meat / seafood / egg_dairy / bean 为系统预置，不可删除、不可改 ID。">
      <el-button type="primary" @click="openCreate">新增分类</el-button>
    </PageHeader>

    <section class="page-card table-wrap">
      <el-table v-loading="loading" :data="tableData" empty-text="暂无分类">
        <el-table-column prop="emoji" label="" width="60" />
        <el-table-column prop="id" label="分类 ID" min-width="130" />
        <el-table-column prop="name" label="名称" min-width="120" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="关联食材" width="110">
          <template #default="{ row }">{{ row.foodCount }}</template>
        </el-table-column>
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.isSystem ? 'warning' : 'info'">
              {{ row.isSystem ? '系统预置' : '自定义' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="row.enabled ? 'success' : 'info'">
              {{ row.enabled ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Edit" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" :icon="row.enabled ? TurnOff : Open" @click="handleToggle(row)">
              {{ row.enabled ? '停用' : '启用' }}
            </el-button>
            <el-button link type="danger" :icon="Delete" :disabled="row.isSystem || row.foodCount > 0" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="dialogVisible" :title="dialogMode === 'create' ? '新增分类' : '编辑分类'" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="88px">
        <el-form-item label="分类 ID" prop="id">
          <el-input v-model="form.id" :disabled="dialogMode === 'edit'" placeholder="例如：snack，需兼容小程序 categoryId" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" maxlength="20" />
        </el-form-item>
        <el-form-item label="Emoji">
          <el-input v-model="form.emoji" maxlength="4" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="1" :max="9999" />
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
