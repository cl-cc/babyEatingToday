<script setup lang="ts">
import ThemeToggle from '@/components/ThemeToggle.vue'
import { useAuthStore } from '@/stores/auth'
import {
  Collection,
  DataAnalysis,
  Document,
  FolderOpened,
  Food,
  List,
  Notebook,
  Operation,
  SwitchButton,
  User,
  Avatar,
} from '@element-plus/icons-vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const defaultOpeneds = ['content', 'system']

const breadcrumbs = computed(() => {
  const items = [{ title: '首页', path: '/dashboard' }]
  if (route.meta.group) items.push({ title: String(route.meta.group), path: '' })
  if (route.meta.title && route.name !== 'dashboard') {
    items.push({ title: String(route.meta.title), path: route.path })
  }
  return items
})

async function handleLogout() {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="layout">
    <aside class="layout__aside">
      <div class="brand">团子食光后台</div>
      <el-menu
        :default-openeds="defaultOpeneds"
        :default-active="route.path"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据概览</span>
        </el-menu-item>
        <el-sub-menu index="content">
          <template #title>
            <el-icon><FolderOpened /></el-icon>
            <span>内容管理</span>
          </template>
          <el-menu-item index="/content/foods">
            <el-icon><Food /></el-icon>
            <span>食材管理</span>
          </el-menu-item>
          <el-menu-item index="/content/categories">
            <el-icon><Collection /></el-icon>
            <span>分类管理</span>
          </el-menu-item>
          <el-menu-item index="/content/recipes">
            <el-icon><Notebook /></el-icon>
            <span>食谱管理</span>
          </el-menu-item>
          <el-menu-item index="/content/knowledge">
            <el-icon><Document /></el-icon>
            <span>喂养知识</span>
          </el-menu-item>
          <el-menu-item index="/content/rules">
            <el-icon><Operation /></el-icon>
            <span>推荐规则</span>
          </el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="system">
          <template #title>
            <el-icon><User /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/system/users">
            <el-icon><Avatar /></el-icon>
            <span>小程序用户</span>
          </el-menu-item>
          <el-menu-item index="/system/admins">
            <el-icon><User /></el-icon>
            <span>管理员管理</span>
          </el-menu-item>
          <el-menu-item index="/system/logs">
            <el-icon><List /></el-icon>
            <span>操作日志</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </aside>

    <div class="layout__main">
      <header class="layout__header">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.title">
            <router-link v-if="item.path && item.path !== route.path" :to="item.path">
              {{ item.title }}
            </router-link>
            <span v-else>{{ item.title }}</span>
          </el-breadcrumb-item>
        </el-breadcrumb>
        <div class="layout__user">
          <ThemeToggle />
          <span>{{ auth.user?.displayName || '管理员' }}</span>
          <el-button text type="primary" :icon="SwitchButton" @click="handleLogout">退出登录</el-button>
        </div>
      </header>
      <main class="layout__content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  height: 100dvh;
  overflow: hidden;
}

.layout__aside {
  width: var(--app-sidebar-w);
  height: 100%;
  background: var(--app-sidebar);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.brand {
  height: var(--app-header-h);
  display: flex;
  align-items: center;
  padding: 0 18px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.layout__aside :deep(.el-menu) {
  flex: 1;
  overflow-y: auto;
  border-right: none;
  background: var(--app-sidebar);
}

.layout__aside :deep(.el-sub-menu .el-menu) {
  border-right: none;
  background: var(--app-sidebar);
}

.layout__aside :deep(.el-menu-item),
.layout__aside :deep(.el-sub-menu__title) {
  color: var(--app-sidebar-text);
  background: transparent;
}

.layout__aside :deep(.el-menu-item:hover),
.layout__aside :deep(.el-sub-menu__title:hover) {
  background: rgba(232, 145, 168, 0.16);
}

.layout__aside :deep(.el-menu-item.is-active) {
  background: var(--app-sidebar-active);
  color: #fff;
}

.layout__main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.layout__header {
  height: var(--app-header-h);
  flex-shrink: 0;
  background: var(--app-surface);
  border-bottom: 1px solid var(--app-border);
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.layout__user {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--app-muted);
  font-size: 13px;
}

.layout__content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 20px;
}
</style>
