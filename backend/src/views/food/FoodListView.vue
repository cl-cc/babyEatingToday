<script setup lang="ts">
import { listCategories, type CategoryView } from '@/api/category'
import { createFood, deleteFood, getFood, listFoods, setFoodEnabled, updateFood } from '@/api/food'
import EmojiField from '@/components/EmojiField.vue'
import PageHeader from '@/components/PageHeader.vue'
import type { Food, FoodPayload, FoodQuery } from '@/types'
import { Delete, Edit, Open, TurnOff, View } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'

interface FoodGroupRow {
  id: string
  isGroup: true
  name: string
  emoji: string
  categoryId: string
  foodCount: number
  children: Food[]
}

const loading = ref(false)
const submitting = ref(false)
const categories = ref<CategoryView[]>([])
const tableData = ref<FoodGroupRow[]>([])
const total = ref(0)
const tableKey = ref(0)
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit' | 'view'>('create')
const editingId = ref('')
const formRef = ref<FormInstance>()

const query = reactive<FoodQuery>({
  name: '',
  categoryId: '',
  enabled: '',
  page: 1,
  pageSize: 10,
})

const expandAll = computed(() => Boolean(query.name || query.categoryId || query.enabled !== ''))

const emptyForm = (): FoodPayload => ({
  name: '',
  emoji: '',
  categoryId: '',
  subCategory: '',
  enabled: true,
  sort: 100,
})

const form = reactive<FoodPayload>(emptyForm())

const rules: FormRules<FoodPayload> = {
  name: [{ required: true, message: '请输入食材名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择一级分类', trigger: 'change' }],
  subCategory: [{ required: true, message: '请输入子分类', trigger: 'blur' }],
}

const dialogTitle = {
  create: '新增食材',
  edit: '编辑食材',
  view: '食材详情',
}

function categoryName(id: string): string {
  return categories.value.find((item) => item.id === id)?.name || id
}

function groupFoods(foods: Food[]): FoodGroupRow[] {
  const groups = new Map<string, FoodGroupRow>()

  for (const category of categories.value) {
    groups.set(category.id, {
      id: `cat:${category.id}`,
      isGroup: true,
      name: category.name,
      emoji: category.emoji,
      categoryId: category.id,
      foodCount: 0,
      children: [],
    })
  }

  for (const food of foods) {
    const key = food.categoryId || 'unknown'
    if (!groups.has(key)) {
      groups.set(key, {
        id: `cat:${key}`,
        isGroup: true,
        name: categoryName(key),
        emoji: '🥗',
        categoryId: key,
        foodCount: 0,
        children: [],
      })
    }
    groups.get(key)?.children.push(food)
  }

  return [...groups.values()]
    .map((group) => ({ ...group, foodCount: group.children.length }))
    .filter((group) => group.children.length > 0)
}

function resetForm() {
  Object.assign(form, emptyForm())
  formRef.value?.clearValidate()
}

async function loadCategories() {
  categories.value = await listCategories()
}

async function loadFoods() {
  loading.value = true
  try {
    const first = await listFoods({ ...query, page: 1, pageSize: 500 })
    const foods = [...first.list]
    const pageSize = first.pageSize || 50
    const pages = Math.ceil(first.total / pageSize)
    for (let page = 2; page <= pages; page += 1) {
      const next = await listFoods({ ...query, page, pageSize })
      foods.push(...next.list)
    }
    tableData.value = groupFoods(foods)
    total.value = first.total
    tableKey.value += 1
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '食材列表加载失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  void loadFoods()
}

function handleReset() {
  query.name = ''
  query.categoryId = ''
  query.enabled = ''
  query.page = 1
  void loadFoods()
}

function openCreate() {
  dialogMode.value = 'create'
  editingId.value = ''
  resetForm()
  dialogVisible.value = true
}

async function openEdit(row: Food, mode: 'edit' | 'view') {
  dialogMode.value = mode
  editingId.value = row.id
  const detail = await getFood(row.id)
  Object.assign(form, {
    name: detail.name,
    emoji: detail.emoji,
    categoryId: detail.categoryId,
    subCategory: detail.subCategory,
    enabled: detail.enabled,
    sort: detail.sort,
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  if (dialogMode.value === 'view') {
    dialogVisible.value = false
    return
  }
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (dialogMode.value === 'create') {
      await createFood({ ...form })
      ElMessage.success('已新增食材')
    } else {
      await updateFood(editingId.value, { ...form })
      ElMessage.success('已保存食材')
    }
    dialogVisible.value = false
    await loadFoods()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败')
  } finally {
    submitting.value = false
  }
}

async function handleToggle(row: Food) {
  try {
    await setFoodEnabled(row.id, !row.enabled)
    ElMessage.success(row.enabled ? '已停用食材' : '已启用食材')
    await loadFoods()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '状态更新失败')
  }
}

async function handleDelete(row: Food) {
  try {
    await ElMessageBox.confirm(
      `确认删除「${row.name}」？若已被食谱或历史记录引用，请优先使用停用。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
    await deleteFood(row.id)
    ElMessage.success('已删除食材')
    await loadFoods()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error instanceof Error ? error.message : '删除失败')
  }
}

onMounted(async () => {
  try {
    await loadCategories()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '分类加载失败')
  }
  await loadFoods()
})
</script>

<template>
  <div>
    <PageHeader title="食材管理" description="数据来自云数据库 foods 集合，与小程序公共食材目录同步。优先停用，避免误删已被引用的食材。">
      <el-button type="primary" @click="openCreate">新增食材</el-button>
    </PageHeader>

    <section class="page-card filter">
      <el-form :inline="true" @submit.prevent="handleSearch">
        <el-form-item label="食材名称">
          <el-input v-model="query.name" clearable placeholder="搜索名称" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="query.categoryId" clearable placeholder="全部" style="width: 160px">
            <el-option v-for="item in categories" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.enabled" clearable placeholder="全部" style="width: 120px">
            <el-option label="启用" :value="true" />
            <el-option label="停用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="page-card table-wrap">
      <el-table
        :key="tableKey"
        v-loading="loading"
        :data="tableData"
        row-key="id"
        :tree-props="{ children: 'children' }"
        :default-expand-all="expandAll"
        empty-text="暂无食材数据"
      >
        <el-table-column label="名称" min-width="220">
          <template #default="{ row }">
            <div v-if="row.isGroup" class="group-cell">
              <span class="group-cell__emoji">{{ row.emoji }}</span>
              <span class="group-cell__name">{{ row.name }}</span>
              <em>{{ row.foodCount }}</em>
            </div>
            <div v-else class="food-cell">
              <span class="food-cell__emoji">{{ row.emoji }}</span>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="子分类" min-width="120">
          <template #default="{ row }">{{ row.isGroup ? '' : row.subCategory }}</template>
        </el-table-column>
        <el-table-column label="排序" width="80">
          <template #default="{ row }">{{ row.isGroup ? '' : row.sort }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag v-if="!row.isGroup" :type="row.enabled ? 'success' : 'info'" size="small">
              {{ row.enabled ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <template v-if="!row.isGroup">
              <el-button link type="primary" :icon="View" @click="openEdit(row, 'view')">查看</el-button>
              <el-button link type="primary" :icon="Edit" @click="openEdit(row, 'edit')">编辑</el-button>
              <el-button link type="primary" :icon="row.enabled ? TurnOff : Open" @click="handleToggle(row)">
                {{ row.enabled ? '停用' : '启用' }}
              </el-button>
              <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
      <p class="table-hint">共 {{ total }} 条食材，按一级分类折叠。搜索时会自动展开。</p>
    </section>

    <el-dialog v-model="dialogVisible" :title="dialogTitle[dialogMode]" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="88px" :disabled="dialogMode === 'view'">
        <el-form-item label="食材名称" prop="name">
          <el-input v-model="form.name" maxlength="20" placeholder="例如：西兰花" />
        </el-form-item>
        <el-form-item label="图标" prop="emoji">
          <EmojiField v-model="form.emoji" :disabled="dialogMode === 'view'" />
        </el-form-item>
        <el-form-item label="一级分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="item in categories" :key="item.id" :label="`${item.name}（${item.id}）`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="子分类" prop="subCategory">
          <el-input v-model="form.subCategory" maxlength="20" placeholder="例如：花菜类" />
        </el-form-item>
        <el-form-item label="排序值" prop="sort">
          <el-input-number v-model="form.sort" :min="1" :max="9999" />
        </el-form-item>
        <el-form-item label="是否启用" prop="enabled">
          <el-switch v-model="form.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ dialogMode === 'view' ? '关闭' : '取消' }}</el-button>
        <el-button v-if="dialogMode !== 'view'" type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.filter {
  padding: 16px 16px 0;
  margin-bottom: 12px;
}

.table-wrap {
  padding: 12px 16px 16px;
}

.group-cell,
.food-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.group-cell__emoji,
.food-cell__emoji {
  font-size: 18px;
  line-height: 1;
}

.group-cell__name {
  font-weight: 620;
}

.group-cell em {
  font-style: normal;
  color: var(--app-muted);
  font-size: 12px;
}

.table-hint {
  margin: 12px 0 0;
  color: var(--app-muted);
  font-size: 12px;
}

</style>
