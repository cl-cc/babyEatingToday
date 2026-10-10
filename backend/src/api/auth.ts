import type { AdminUser, LoginPayload, LoginResult } from '@/types'
import { callAdmin } from './client'

export async function login(payload: LoginPayload): Promise<LoginResult> {
  return callAdmin<LoginResult>(
    'login',
    {
      username: payload.username.trim(),
      password: payload.password,
    },
    { skipAuth: true },
  )
}

export async function logout(): Promise<void> {
  return Promise.resolve()
}

export async function getCurrentUser(): Promise<AdminUser> {
  return callAdmin<AdminUser>('me')
}
