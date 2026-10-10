import type { Food, FoodPayload, FoodQuery, PageResult } from '@/types'
import { callAdmin } from './client'

export async function listFoods(query: FoodQuery): Promise<PageResult<Food>> {
  return callAdmin<PageResult<Food>>('listFoods', {
    name: query.name || '',
    categoryId: query.categoryId || '',
    enabled: query.enabled,
    page: query.page,
    pageSize: query.pageSize,
  })
}

export async function getFood(id: string): Promise<Food> {
  return callAdmin<Food>('getFood', { id })
}

export async function createFood(payload: FoodPayload): Promise<Food> {
  return callAdmin<Food>('createFood', { ...payload })
}

export async function updateFood(id: string, payload: FoodPayload): Promise<Food> {
  return callAdmin<Food>('updateFood', { id, ...payload })
}

export async function setFoodEnabled(id: string, enabled: boolean): Promise<Food> {
  return callAdmin<Food>('setFoodEnabled', { id, enabled })
}

export async function deleteFood(id: string): Promise<void> {
  await callAdmin<null>('deleteFood', { id })
}
