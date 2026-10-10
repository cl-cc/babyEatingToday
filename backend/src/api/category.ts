import type { Category, CategoryPayload } from '@/types'
import { callAdmin } from './client'

export interface CategoryView extends Category {
  foodCount: number
}

export async function listCategories(): Promise<CategoryView[]> {
  return callAdmin<CategoryView[]>('listCategories')
}

export async function createCategory(payload: CategoryPayload): Promise<Category> {
  return callAdmin<Category>('createCategory', { ...payload })
}

export async function updateCategory(id: string, payload: CategoryPayload): Promise<Category> {
  return callAdmin<Category>('updateCategory', { id, ...payload })
}

export async function deleteCategory(id: string): Promise<void> {
  await callAdmin<null>('deleteCategory', { id })
}
