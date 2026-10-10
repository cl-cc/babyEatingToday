import type { DashboardStats } from '@/types'
import { callAdmin } from './client'

export interface SeedResult {
  categories: number
  foods: number
  skipped: boolean
  message: string
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return callAdmin<DashboardStats>('dashboard')
}

export async function seedIfEmpty(): Promise<SeedResult> {
  return callAdmin<SeedResult>('seedIfEmpty')
}
