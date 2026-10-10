<script setup lang="ts">
import { getBaby, listBabies } from '@/api/user';
import PageHeader from '@/components/PageHeader.vue';
import type { BabySummary, BabyUser, BabyUserDetail } from '@/types';
import { View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { onMounted, reactive, ref } from 'vue';

const loading = ref(false);
const detailLoading = ref(false);
const tableData = ref<BabyUser[]>([]);
const total = ref(0);
const summary = ref<BabySummary>({
  total: 0,
  withAllergies: 0,
  withEaten: 0,
  checkedIn: 0,
  defaultOnly: 0,
});
const dialogVisible = ref(false);
const detail = ref<BabyUserDetail | null>(null);

const query = reactive({
  keyword: '',
  hideDefault: false,
  page: 1,
  pageSize: 10,
});

const cards = [
  { key: 'total', label: '同步用户' },
  { key: 'withAllergies', label: '填写过敏' },
  { key: 'withEaten', label: '标记已吃' },
  { key: 'checkedIn', label: '有打卡' },
  { key: 'defaultOnly', label: '默认空档案' },
] as const;

function genderText(value: string) {
  if (value === 'boy' || value === '男' || value === 'male' || value === '男宝') return '男宝'
  if (value === 'girl' || value === '女' || value === 'female' || value === '女宝') return '女宝'
  return '未填'
}

function ageText(row: BabyUser) {
  const months = row.ageMonths ? `${row.ageMonths}个月` : '';
  if (row.ageId && months) return `${row.ageId} · ${months}`;
  return row.ageId || months || '未填';
}

function shortOpenid(value: string) {
  if (!value) return '无';
  return value.length > 8 ? `…${value.slice(-8)}` : value;
}

function formatTime(value: string) {
  return value ? value.replace('T', ' ').slice(0, 16) : '—';
}

function nameInitial(value: string) {
  return (value || '宝').trim().slice(0, 1);
}

function aiRemainText(row: { aiSynced?: boolean; aiRemain: number | null; aiLimit: number }) {
  if (!row.aiSynced || row.aiRemain == null) return '未同步';
  return `${row.aiRemain} / ${row.aiLimit}`;
}

async function loadList() {
  loading.value = true;
  try {
    const result = await listBabies(query);
    tableData.value = result.list;
    total.value = result.total;
    summary.value = result.summary;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '用户列表加载失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.page = 1;
  void loadList();
}

function handleReset() {
  query.keyword = '';
  query.hideDefault = false;
  query.page = 1;
  void loadList();
}

async function openDetail(row: BabyUser) {
  dialogVisible.value = true;
  detail.value = null;
  detailLoading.value = true;
  try {
    detail.value = await getBaby(row.id);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '档案加载失败');
    dialogVisible.value = false;
  } finally {
    detailLoading.value = false;
  }
}

onMounted(() => {
  void loadList();
});
</script>

<template>
  <div>
    <PageHeader title="小程序用户" description="只读查看已同步到云端的宝宝档案。没有微信昵称和手机号，默认空档案是打开过小程序但几乎没填资料的人。" />

    <section class="metrics page-card">
      <div v-for="card in cards" :key="card.key" class="metrics__item">
        <strong>{{ summary[card.key] }}</strong>
        <span>{{ card.label }}</span>
      </div>
    </section>

    <section class="page-card filter">
      <el-form :inline="true" @submit.prevent="handleSearch">
        <el-form-item label="搜索">
          <el-input v-model="query.keyword" clearable placeholder="宝宝昵称或 openid" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="query.hideDefault" @change="handleSearch">隐藏默认空档案</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="page-card table-wrap">
      <el-table v-loading="loading" :data="tableData" empty-text="还没有同步到云端的用户">
        <el-table-column prop="name" label="宝宝昵称" min-width="110" />
        <el-table-column label="性别" width="80">
          <template #default="{ row }">{{ genderText(row.gender) }}</template>
        </el-table-column>
        <el-table-column label="月龄" min-width="140">
          <template #default="{ row }">{{ ageText(row) }}</template>
        </el-table-column>
        <!-- <el-table-column label="openid" min-width="130">
          <template #default="{ row }">
            <span :title="row.openid">{{ shortOpenid(row.openid) }}</span>
          </template>
        </el-table-column> -->
        <el-table-column label="过敏" width="80">
          <template #default="{ row }">{{ row.allergyCount }}</template>
        </el-table-column>
        <el-table-column label="已吃" width="80">
          <template #default="{ row }">{{ row.eatenCount }}</template>
        </el-table-column>
        <el-table-column label="打卡" width="80">
          <template #default="{ row }">{{ row.checkInCount }}</template>
        </el-table-column>
        <el-table-column label="AI 余量" width="110">
          <template #default="{ row }">{{ aiRemainText(row) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="row.isDefault ? 'info' : 'success'">
              {{ row.isDefault ? '默认空档案' : '有使用痕迹' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最近同步" min-width="150">
          <template #default="{ row }">{{ formatTime(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="openDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination v-model:current-page="query.page" v-model:page-size="query.pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @current-change="loadList" @size-change="handleSearch" />
      </div>
    </section>

    <el-dialog v-model="dialogVisible" class="profile-dialog" title="用户档案" width="640px" align-center destroy-on-close>
      <div class="profile" v-loading="detailLoading">
        <template v-if="detail">
          <header class="profile__hero">
            <div class="profile__avatar">{{ nameInitial(detail.name) }}</div>
            <div class="profile__who">
              <h3>{{ detail.name }}</h3>
              <p>{{ genderText(detail.gender) }} · {{ ageText(detail) }}</p>
            </div>
            <span class="profile__badge" :class="{ 'is-empty': detail.isDefault }">
              {{ detail.isDefault ? '默认空档案' : '有使用痕迹' }}
            </span>
          </header>

          <dl class="profile__meta">
            <div>
              <dt>生日</dt>
              <dd>{{ detail.birthDate || '未填' }}</dd>
            </div>
            <div>
              <dt>最近同步</dt>
              <dd>{{ formatTime(detail.updatedAt) }}</dd>
            </div>
            <div>
              <dt>今日 AI 余量</dt>
              <dd>{{ aiRemainText(detail) }}</dd>
            </div>
            <div class="profile__meta--wide">
              <dt>openid</dt>
              <dd>{{ detail.openid || '无' }}</dd>
            </div>
          </dl>

          <div class="profile__counts">
            <div>
              <strong>{{ detail.allergyCount }}</strong>
              <span>过敏</span>
            </div>
            <div>
              <strong>{{ detail.eatenCount }}</strong>
              <span>已吃</span>
            </div>
            <div>
              <strong>{{ detail.fridgeCount }}</strong>
              <span>冰箱</span>
            </div>
            <div>
              <strong>{{ detail.checkInCount }}</strong>
              <span>打卡</span>
            </div>
          </div>

          <section class="profile__block">
            <h4>过敏</h4>
            <p v-if="!detail.allergies.length" class="profile__empty">还没填写</p>
            <div v-else class="profile__chips">
              <span v-for="item in detail.allergies" :key="item">{{ item }}</span>
            </div>
          </section>
          <section class="profile__block">
            <h4>不吃</h4>
            <p v-if="!detail.dislikes.length" class="profile__empty">还没填写</p>
            <div v-else class="profile__chips">
              <span v-for="item in detail.dislikes" :key="item">{{ item }}</span>
            </div>
          </section>
          <section class="profile__block">
            <h4>冰箱</h4>
            <p v-if="!detail.fridge.length" class="profile__empty">还没填写</p>
            <div v-else class="profile__chips">
              <span v-for="item in detail.fridge" :key="item">{{ item }}</span>
            </div>
          </section>
          <section class="profile__block">
            <h4>已吃</h4>
            <p v-if="!detail.eatenFoods.length" class="profile__empty">还没填写</p>
            <div v-else class="profile__chips">
              <span v-for="item in detail.eatenFoods" :key="item">{{ item }}</span>
            </div>
          </section>
          <section class="profile__block">
            <h4>打卡日期</h4>
            <p v-if="!detail.checkInDates.length" class="profile__empty">暂无打卡</p>
            <div v-else class="profile__chips profile__chips--dates">
              <span v-for="item in detail.checkInDates" :key="item">{{ item }}</span>
            </div>
          </section>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.metrics {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  margin-bottom: 12px;
  padding: 0;
  overflow: hidden;
}

.metrics__item {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 18px 16px;
}

.metrics__item + .metrics__item::before {
  content: '';
  position: absolute;
  top: 16px;
  bottom: 16px;
  left: 0;
  width: 1px;
  background: var(--app-border);
}

.metrics__item strong {
  font-size: 22px;
  font-weight: 620;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  color: var(--app-text);
}

.metrics__item span {
  color: var(--app-muted);
  font-size: 12px;
}

@media (max-width: 720px) {
  .metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.filter {
  padding: 12px 16px 0;
  margin-bottom: 12px;
}

.table-wrap {
  padding: 12px 16px 16px;
}

.profile {
  min-height: 240px;
}

.profile__hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 4px 4px 20px;
}

.profile__avatar {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--el-color-primary-light-8);
  color: var(--app-primary);
  font-size: 22px;
  font-weight: 620;
}

.profile__who {
  min-width: 0;
  flex: 1;
}

.profile__who h3 {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 620;
  color: var(--app-text);
}

.profile__who p {
  margin: 0;
  color: var(--app-muted);
  font-size: 13px;
}

.profile__badge {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--el-color-primary-light-8);
  color: var(--app-primary);
  font-size: 12px;
}

.profile__badge.is-empty {
  background: var(--app-bg);
  color: var(--app-muted);
}

.profile__meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 20px;
  margin: 0;
  padding: 16px 4px;
  border-top: 1px solid var(--app-border);
  border-bottom: 1px solid var(--app-border);
}

.profile__meta div {
  min-width: 0;
}

.profile__meta--wide {
  grid-column: 1 / -1;
}

.profile__meta dt {
  margin-bottom: 4px;
  color: var(--app-muted);
  font-size: 12px;
}

.profile__meta dd {
  margin: 0;
  font-size: 13px;
  word-break: break-all;
}

.profile__counts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin: 18px 0 8px;
}

.profile__counts div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 0;
  text-align: center;
}

.profile__counts div + div {
  border-left: 1px solid var(--app-border);
}

.profile__counts strong {
  font-size: 20px;
  font-weight: 620;
  font-variant-numeric: tabular-nums;
}

.profile__counts span {
  color: var(--app-muted);
  font-size: 12px;
}

.profile__block {
  padding: 14px 4px 2px;
}

.profile__block h4 {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text);
}

.profile__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.profile__chips span {
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--app-bg);
  color: var(--app-text);
  font-size: 12px;
}

.profile__chips--dates span {
  color: var(--app-muted);
}

.profile__empty {
  margin: 0;
  color: var(--app-muted);
  font-size: 13px;
}
</style>

<style>
.profile-dialog.el-dialog {
  border-radius: 16px;
  overflow: hidden;
  background: var(--app-surface);
}

.profile-dialog .el-dialog__header {
  padding: 16px 20px 0;
  margin-right: 0;
}

.profile-dialog .el-dialog__title {
  font-size: 13px;
  font-weight: 500;
  color: var(--app-muted);
}

.profile-dialog .el-dialog__headerbtn {
  top: 16px;
  right: 16px;
}

.profile-dialog .el-dialog__body {
  padding: 8px 24px 28px;
}
</style>
