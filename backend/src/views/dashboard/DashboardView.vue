<script setup lang="ts">
import { getDashboardStats, seedIfEmpty } from '@/api/dashboard'
import CountNumber from '@/components/CountNumber.vue'
import PageHeader from '@/components/PageHeader.vue'
import type { DashboardStats } from '@/types'
import { ElMessage } from 'element-plus'
import { useDark } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([PieChart, BarChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const isDark = useDark({ storageKey: 'tuanzi_admin_theme' })

const router = useRouter()
const loading = ref(false)
const seeding = ref(false)
const stats = ref<DashboardStats | null>(null)

const weekFoodUpdates = computed(() =>
  (stats.value?.foodTrend?.series ?? []).reduce(
    (sum, item) => sum + item.data.reduce((total, value) => total + value, 0),
    0,
  ),
)

const cards = computed(() => {
  const data = stats.value
  const categoryCovered = (data?.categoryStats ?? []).filter((item) => item.value > 0).length
  const recipeAges = (data?.recipeAgeStats ?? []).filter((item) => item.value > 0).length
  const knowledgeKinds = (data?.knowledgeKindStats ?? []).length
  const enabled = data?.foodEnabledCount ?? data?.foodCount ?? 0
  const avgPerCategory =
    data?.categoryCount && data.foodCount ? Math.round(data.foodCount / data.categoryCount) : 0
  return [
    {
      label: '食材总数',
      value: data?.foodCount ?? 0,
      hint: `启用 ${enabled} · 覆盖 ${categoryCovered} 个分类`,
      extra: weekFoodUpdates.value ? `近7日更新 ${weekFoodUpdates.value}` : '近7日暂无更新',
      path: '/content/foods',
    },
    {
      label: '食谱总数',
      value: data?.recipeCount ?? 0,
      hint: recipeAges ? `覆盖 ${recipeAges} 个月龄档` : '尚未按月龄归档',
      extra: data?.userCount ? `服务 ${data.userCount} 位用户` : '可配置推荐套餐',
      path: '/content/recipes',
    },
    {
      label: '喂养知识',
      value: data?.knowledgeCount ?? 0,
      hint: knowledgeKinds ? `${knowledgeKinds} 种内容类型` : '提示 / 建议 / 权威说明',
      extra: '首页与能不能吃共用',
      path: '/content/knowledge',
    },
    {
      label: '分类总数',
      value: data?.categoryCount ?? 0,
      hint: avgPerCategory ? `平均 ${avgPerCategory} 条食材 / 类` : '系统分类待初始化',
      extra: data?.userCount ? `小程序用户 ${data.userCount}` : '对应排敏与搭配',
      path: '/content/categories',
    },
  ]
})

const axisColor = computed(() => (isDark.value ? '#c9a8b2' : '#8d6b75'))
const splitColor = computed(() => (isDark.value ? '#4a3840' : '#f3d6de'))
const chartColors = ['#e891a8', '#f0b0c0', '#d47490', '#f6c5d2', '#c96a86', '#e8a8b8', '#fadce4']

const chartOption = computed(() => ({
  color: chartColors,
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, icon: 'circle', textStyle: { color: axisColor.value } },
  series: [
    {
      type: 'pie',
      radius: ['46%', '68%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 2, borderColor: isDark.value ? '#2a1f24' : '#fff', borderWidth: 2 },
      label: { formatter: '{b} {c}', color: axisColor.value },
      data: stats.value?.categoryStats ?? [],
    },
  ],
}))

const foodChartOption = computed(() => {
  const trend = stats.value?.foodTrend
  const days = trend?.days ?? []
  const series = trend?.series ?? []
  const lastIndex = series.length - 1
  return {
    color: chartColors,
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, icon: 'circle', textStyle: { color: axisColor.value } },
    grid: { left: 36, right: 8, top: 12, bottom: 42 },
    xAxis: {
      type: 'category',
      data: days.map((item) => item.label),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: splitColor.value } },
      axisLabel: { color: axisColor.value },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: axisColor.value },
      splitLine: { lineStyle: { color: splitColor.value, type: 'dashed' } },
    },
    series: series.map((item, index) => ({
      name: item.name,
      type: 'bar',
      stack: 'food',
      barMaxWidth: 22,
      data: item.data,
      itemStyle: {
        borderRadius: index === lastIndex ? [6, 6, 0, 0] : 0,
      },
    })),
  }
})

const knowledgeHasData = computed(() => (stats.value?.knowledgeKindStats || []).some((item) => item.value > 0))
const recipeHasData = computed(() => (stats.value?.recipeAgeStats || []).some((item) => item.value > 0))
const userHasData = computed(() => (stats.value?.userAgeStats || []).some((item) => item.value > 0))
const subHasData = computed(() => (stats.value?.subCategoryStats || []).some((item) => item.value > 0))

const moduleStats = computed(() =>
  [
    { name: '食材', value: stats.value?.foodCount ?? 0 },
    { name: '食谱', value: stats.value?.recipeCount ?? 0 },
    { name: '知识', value: stats.value?.knowledgeCount ?? 0 },
    { name: '分类', value: stats.value?.categoryCount ?? 0 },
    { name: '用户', value: stats.value?.userCount ?? 0 },
  ].filter((item) => item.value > 0),
)

const mixChartTitle = computed(() => {
  if (knowledgeHasData.value) return '喂养知识构成'
  if (recipeHasData.value) return '食谱月龄分布'
  if (userHasData.value) return '小程序用户月龄'
  return '内容模块对比'
})

const mixChartData = computed(() => {
  if (knowledgeHasData.value) return stats.value?.knowledgeKindStats ?? []
  if (recipeHasData.value) return stats.value?.recipeAgeStats ?? []
  if (userHasData.value) return stats.value?.userAgeStats ?? []
  return moduleStats.value
})

const mixChartOption = computed(() => {
  if (knowledgeHasData.value) {
    return {
      color: chartColors,
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, icon: 'circle', textStyle: { color: axisColor.value } },
      series: [
        {
          type: 'pie',
          roseType: 'radius',
          radius: ['18%', '68%'],
          center: ['50%', '46%'],
          itemStyle: { borderRadius: 6, borderColor: isDark.value ? '#2a1f24' : '#fff', borderWidth: 2 },
          label: { formatter: '{b} {c}', color: axisColor.value },
          data: mixChartData.value,
        },
      ],
    }
  }
  return {
    color: chartColors,
    tooltip: { trigger: 'axis' },
    grid: { left: 48, right: 12, top: 16, bottom: 28 },
    xAxis: {
      type: 'category',
      data: mixChartData.value.map((item) => item.name),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: splitColor.value } },
      axisLabel: { color: axisColor.value, fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: axisColor.value },
      splitLine: { lineStyle: { color: splitColor.value, type: 'dashed' } },
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 26,
        data: mixChartData.value.map((item) => item.value),
        itemStyle: { color: '#e891a8', borderRadius: [6, 6, 0, 0] },
      },
    ],
  }
})

const subCategoryTitle = computed(() => (subHasData.value ? '食材细分 TOP' : '内容模块对比'))

const subCategoryOption = computed(() => {
  const source = subHasData.value ? stats.value?.subCategoryStats ?? [] : moduleStats.value
  const rows = [...source].reverse()
  return {
    color: chartColors,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 72, right: 16, top: 8, bottom: 16 },
    xAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: axisColor.value },
      splitLine: { lineStyle: { color: splitColor.value, type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: rows.map((item) => item.name),
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { color: axisColor.value, fontSize: 12 },
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 16,
        data: rows.map((item) => item.value),
        itemStyle: { color: '#e891a8', borderRadius: [0, 8, 8, 0] },
      },
    ],
  }
})

async function loadStats() {
  loading.value = true
  try {
    stats.value = await getDashboardStats()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '统计加载失败')
  } finally {
    loading.value = false
  }
}

async function handleSeed() {
  seeding.value = true
  try {
    const result = await seedIfEmpty()
    if (result.skipped) {
      ElMessage.info(result.message)
    } else {
      ElMessage.success(result.message)
      await loadStats()
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '初始化失败')
  } finally {
    seeding.value = false
  }
}

onMounted(() => {
  void loadStats()
})
</script>

<template>
  <div>
    <PageHeader title="数据概览" description="统计来自微信云数据库。空集合不会用假数据填充；可在空库时一次性导入小程序现有食材目录。">
      <el-button type="primary" @click="router.push('/content/foods')">新增食材</el-button>
      <el-button :loading="seeding" @click="handleSeed">初始化空库目录</el-button>
    </PageHeader>

    <el-row :gutter="20" class="stat-row">
      <el-col v-for="card in cards" :key="card.label" :xs="12" :md="6">
        <button class="stat soft-card" type="button" @click="router.push(card.path)">
          <span class="stat__label">{{ card.label }}</span>
          <strong><CountNumber :value="card.value" /></strong>
          <span class="stat__hint">{{ card.hint }}</span>
          <span class="stat__extra">{{ card.extra }}</span>
        </button>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :md="12" :xs="24">
        <section class="panel soft-card" v-loading="loading">
          <h3>食材分类统计</h3>
          <VChart class="chart" :option="chartOption" autoresize />
        </section>
      </el-col>
      <el-col :md="12" :xs="24">
        <section class="panel soft-card" v-loading="loading">
          <h3>近7日食材更新</h3>
          <VChart class="chart" :option="foodChartOption" autoresize />
        </section>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :md="12" :xs="24">
        <section class="panel soft-card" v-loading="loading">
          <h3>{{ mixChartTitle }}</h3>
          <VChart class="chart" :option="mixChartOption" autoresize />
        </section>
      </el-col>
      <el-col :md="12" :xs="24">
        <section class="panel soft-card" v-loading="loading">
          <h3>{{ subCategoryTitle }}</h3>
          <VChart class="chart" :option="subCategoryOption" autoresize />
        </section>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.stat-row,
.chart-row {
  margin-bottom: 20px;
}

.soft-card {
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-surface);
  box-shadow: 0 8px 24px rgba(74, 48, 56, 0.07);
}

html.dark .soft-card {
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
}

.stat {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  text-align: left;
  cursor: pointer;
}

.stat:hover {
  box-shadow: 0 10px 28px rgba(232, 145, 168, 0.16);
}

.stat__label {
  color: var(--app-muted);
  font-size: 12px;
}

.stat strong {
  font-size: 26px;
  font-weight: 650;
  line-height: 1.15;
  color: var(--app-text);
}

.stat__hint,
.stat__extra {
  color: var(--app-muted);
  font-size: 12px;
  line-height: 1.4;
}

.stat__extra {
  opacity: 0.78;
}

.panel {
  padding: 12px 14px 8px;
}

.panel h3 {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--app-muted);
}

.chart {
  height: 220px;
}
</style>
