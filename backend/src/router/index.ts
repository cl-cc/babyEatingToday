import { useAuthStore } from '@/stores/auth'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/LoginView.vue'),
    meta: { title: '登录', public: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { title: '数据概览' },
      },
      {
        path: 'content/foods',
        name: 'foods',
        component: () => import('@/views/food/FoodListView.vue'),
        meta: { title: '食材管理', group: '内容管理' },
      },
      {
        path: 'content/categories',
        name: 'categories',
        component: () => import('@/views/category/CategoryListView.vue'),
        meta: { title: '分类管理', group: '内容管理' },
      },
      {
        path: 'content/recipes',
        name: 'recipes',
        component: () => import('@/views/recipe/RecipeListView.vue'),
        meta: { title: '食谱管理', group: '内容管理' },
      },
      {
        path: 'content/knowledge',
        name: 'knowledge',
        component: () => import('@/views/knowledge/KnowledgeListView.vue'),
        meta: { title: '喂养知识', group: '内容管理' },
      },
      {
        path: 'content/rules',
        name: 'rules',
        component: () => import('@/views/rule/RuleListView.vue'),
        meta: { title: '推荐规则', group: '内容管理' },
      },
      {
        path: 'system/users',
        name: 'users',
        component: () => import('@/views/user/UserListView.vue'),
        meta: { title: '小程序用户', group: '系统管理' },
      },
      {
        path: 'system/admins',
        name: 'admins',
        component: () => import('@/views/admin/AdminListView.vue'),
        meta: { title: '管理员管理', group: '系统管理' },
      },
      {
        path: 'system/logs',
        name: 'logs',
        component: () => import('@/views/log/LogListView.vue'),
        meta: { title: '操作日志', group: '系统管理' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  document.title = to.meta.title
    ? `${String(to.meta.title)} · 团子食光管理后台`
    : '团子食光管理后台'

  if (to.meta.public) {
    if (auth.isLoggedIn && to.name === 'login') return { name: 'dashboard' }
    return true
  }
  if (!auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
