<script setup lang="ts">
import { createKnowledge, deleteKnowledge, listKnowledge, updateKnowledge, type KnowledgePayload } from '@/api/content'
import EmojiField from '@/components/EmojiField.vue'
import PageHeader from '@/components/PageHeader.vue'
import type { KnowledgeItem } from '@/types'
import { Delete, Edit } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'

const KIND_OPTIONS = [
  { id: 'tip', label: '暖心提示' },
  { id: 'nutrition', label: '营养提示' },
  { id: 'suggestion', label: '今日建议' },
  { id: 'hot', label: '热门查询' },
  { id: 'can-eat', label: '能不能吃' },
  { id: 'tag', label: '营养标签' },
  { id: 'authority', label: '权威建议' },
  { id: 'article', label: '喂养说明' },
]

const AGE_OPTIONS = [
  { id: '6-8', label: '6-8个月' },
  { id: '8-10', label: '8-10个月' },
  { id: '10-12', label: '10-12个月' },
  { id: '1-2', label: '1-2岁' },
  { id: '2-3', label: '2-3岁' },
  { id: '4-5', label: '4-5岁' },
  { id: '6-7', label: '6-7岁' },
]

const KIND_LABEL: Record<string, string> = Object.fromEntries(KIND_OPTIONS.map((item) => [item.id, item.label]))

const loading = ref(false)
const submitting = ref(false)
const list = ref<KnowledgeItem[]>([])
const kindFilter = ref('')
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const editingId = ref('')
const formRef = ref<FormInstance>()

type FormModel = KnowledgePayload & {
  ages: string[]
  leadText: string
  actionText: string
  whoAdvice: string
  aapAdvice: string
  canValue: string
}

const emptyForm = (): FormModel => ({
  kind: 'article',
  title: '',
  source: '',
  content: '',
  emoji: '',
  ageRange: '',
  extra: '',
  enabled: true,
  ages: [],
  leadText: '今天推荐',
  actionText: '尝试',
  whoAdvice: '',
  aapAdvice: '',
  canValue: '',
})

const form = reactive<FormModel>(emptyForm())
const rules: FormRules<FormModel> = {
  kind: [{ required: true, message: '请选择类型', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
}

const filteredList = computed(() => {
  if (!kindFilter.value) return list.value
  return list.value.filter((item) => item.kind === kindFilter.value)
})

function kindLabel(kind: string) {
  return KIND_LABEL[kind] || '喂养说明'
}

function parseAuthority(row: KnowledgeItem) {
  const raw = String(row.content || '').trim()
  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw) as { whoAdvice?: string; aapAdvice?: string; can?: string | boolean }
      return {
        whoAdvice: parsed.whoAdvice || '',
        aapAdvice: parsed.aapAdvice || '',
        canValue: parsed.can == null ? '' : String(parsed.can),
      }
    } catch {
      return { whoAdvice: raw, aapAdvice: '', canValue: '' }
    }
  }
  return { whoAdvice: raw, aapAdvice: '', canValue: '' }
}

function parseSuggestion(row: KnowledgeItem) {
  let leadText = '今天推荐'
  let actionText = '尝试'
  const raw = String(row.content || '').trim()
  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw) as { leadText?: string; actionText?: string }
      leadText = parsed.leadText || leadText
      actionText = parsed.actionText != null ? parsed.actionText : actionText
    } catch {
      leadText = raw || leadText
    }
  } else if (raw) {
    leadText = raw
  }
  return { leadText, actionText }
}

function toPayload(): KnowledgePayload {
  const kind = form.kind
  let content = form.content
  let ageRange = form.ageRange
  let extra = form.extra
  if (kind === 'suggestion') {
    content = JSON.stringify({ leadText: form.leadText, actionText: form.actionText })
    ageRange = form.ages.join(',')
  }
  if (kind === 'authority') {
    const payload: { whoAdvice: string; aapAdvice: string; can?: string | boolean } = {
      whoAdvice: form.whoAdvice,
      aapAdvice: form.aapAdvice,
    }
    if (form.canValue === 'true') payload.can = true
    else if (form.canValue === 'false') payload.can = false
    else if (form.canValue) payload.can = form.canValue
    content = JSON.stringify(payload)
  }
  return {
    kind,
    title: form.title,
    source: form.source,
    content,
    emoji: form.emoji,
    ageRange,
    extra,
    enabled: form.enabled,
  }
}

async function loadList() {
  loading.value = true
  try {
    list.value = await listKnowledge()
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

function openEdit(row: KnowledgeItem) {
  dialogMode.value = 'edit'
  editingId.value = row.id
  const suggestion = parseSuggestion(row)
  const authority = parseAuthority(row)
  Object.assign(form, {
    kind: row.kind || 'article',
    title: row.title,
    source: row.source,
    content: row.content,
    emoji: row.emoji || '',
    ageRange: row.ageRange || '',
    extra: row.extra || '',
    enabled: row.enabled,
    ages: (row.ageRange || '').split(/[,，]/).filter(Boolean),
    leadText: suggestion.leadText,
    actionText: suggestion.actionText,
    whoAdvice: authority.whoAdvice,
    aapAdvice: authority.aapAdvice,
    canValue: authority.canValue,
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const payload = toPayload()
    if (dialogMode.value === 'create') {
      await createKnowledge(payload)
      ElMessage.success('已新增知识')
    } else {
      await updateKnowledge(editingId.value, payload)
      ElMessage.success('已保存知识')
    }
    dialogVisible.value = false
    await loadList()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row: KnowledgeItem) {
  try {
    await ElMessageBox.confirm(`确认删除「${row.title}」？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await deleteKnowledge(row.id)
    ElMessage.success('已删除知识')
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
    <PageHeader
      title="喂养知识"
      description="维护首页提示、今日建议、能不能吃规则、营养标签和 WHO/AAP 权威建议。小程序启动时读取，云端暂无数据时回退本地兜底。"
    >
      <el-button type="primary" @click="openCreate">新增知识</el-button>
    </PageHeader>
    <section class="page-card table-wrap" v-loading="loading">
      <div class="kind-filter">
        <el-radio-group v-model="kindFilter" size="small">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button v-for="item in KIND_OPTIONS" :key="item.id" :value="item.id">{{ item.label }}</el-radio-button>
        </el-radio-group>
      </div>
      <el-table :data="filteredList" empty-text="暂无知识条目，集合为空时不会展示假数据">
        <el-table-column label="类型" width="110">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ kindLabel(row.kind) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="标题" min-width="220">
          <template #default="{ row }">
            <span v-if="row.emoji">{{ row.emoji }} </span>{{ row.title }}
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="110" />
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

    <el-dialog v-model="dialogVisible" :title="dialogMode === 'create' ? '新增知识' : '编辑知识'" width="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="88px">
        <el-form-item label="类型" prop="kind">
          <el-select v-model="form.kind" style="width: 100%">
            <el-option v-for="item in KIND_OPTIONS" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="form.kind === 'suggestion' || form.kind === 'hot' || form.kind === 'can-eat' ? '名称' : '标题'" prop="title">
          <el-input v-model="form.title" maxlength="80" />
        </el-form-item>
        <el-form-item v-if="form.kind === 'suggestion' || form.kind === 'hot' || form.kind === 'can-eat' || form.kind === 'tag'" label="图标">
          <EmojiField v-model="form.emoji" />
        </el-form-item>
        <el-form-item v-if="form.kind === 'suggestion'" label="引导语">
          <el-input v-model="form.leadText" maxlength="20" placeholder="今天推荐 / 今天试试" />
        </el-form-item>
        <el-form-item v-if="form.kind === 'suggestion'" label="动作词">
          <el-input v-model="form.actionText" maxlength="10" placeholder="尝试；「今天试试」可留空" />
        </el-form-item>
        <el-form-item v-if="form.kind === 'suggestion'" label="适用月龄">
          <el-select v-model="form.ages" multiple collapse-tags collapse-tags-tooltip style="width: 100%">
            <el-option v-for="item in AGE_OPTIONS" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.kind === 'hot'" label="分类">
          <el-input v-model="form.extra" maxlength="20" placeholder="海鲜 / 水果 / 蛋奶" />
        </el-form-item>
        <el-form-item v-if="form.kind === 'can-eat' || form.kind === 'tag' || form.kind === 'authority'" label="关键词">
          <el-input v-model="form.extra" maxlength="80" placeholder="逗号分隔，例如：牛奶,鲜奶；默认建议可留空" />
        </el-form-item>
        <el-form-item v-if="form.kind === 'authority'" label="适用结论">
          <el-select v-model="form.canValue" clearable placeholder="全部结论" style="width: 100%">
            <el-option label="可以吃" value="true" />
            <el-option label="谨慎尝试" value="caution" />
            <el-option label="不建议" value="false" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.kind === 'authority'" label="WHO 建议">
          <el-input v-model="form.whoAdvice" type="textarea" :rows="3" placeholder="可用 ${age} 表示当前月龄" />
        </el-form-item>
        <el-form-item v-if="form.kind === 'authority'" label="AAP 建议">
          <el-input v-model="form.aapAdvice" type="textarea" :rows="3" placeholder="可用 ${age} 表示当前月龄" />
        </el-form-item>
        <el-form-item v-if="form.kind === 'article' || form.kind === 'can-eat'" :label="form.kind === 'can-eat' ? '月龄规则' : '正文'" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="form.kind === 'can-eat' ? 8 : 5"
            :placeholder="form.kind === 'can-eat' ? 'JSON，按 6-8 / 8-10 / 10-12 / 1-2 填写 can、note、avoid 等' : ''"
          />
        </el-form-item>
        <el-form-item v-if="form.kind === 'article'" label="来源">
          <el-input v-model="form.source" maxlength="40" placeholder="例如：WHO / AAP" />
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

.kind-filter {
  padding: 4px 0 12px;
}
</style>
