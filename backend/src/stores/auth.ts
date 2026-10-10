import { login as loginApi, logout as logoutApi } from '@/api/auth'
import type { AdminUser, LoginPayload } from '@/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const TOKEN_KEY = 'tuanzi_admin_token'
const USER_KEY = 'tuanzi_admin_user'

function readUser(): AdminUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AdminUser
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const user = ref<AdminUser | null>(readUser())

  const isLoggedIn = computed(() => Boolean(token.value && user.value))

  async function login(payload: LoginPayload): Promise<void> {
    const result = await loginApi(payload)
    token.value = result.token
    user.value = result.user
    localStorage.setItem(TOKEN_KEY, result.token)
    localStorage.setItem(USER_KEY, JSON.stringify(result.user))
  }

  async function logout(): Promise<void> {
    try {
      await logoutApi()
    } finally {
      token.value = ''
      user.value = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }
  }

  return { token, user, isLoggedIn, login, logout }
})
