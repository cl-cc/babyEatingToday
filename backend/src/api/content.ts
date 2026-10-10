import type { KnowledgeItem, OperationLog, Recipe, RecommendRule } from '@/types'
import { callAdmin } from './client'

export interface RecipePayload {
  name: string
  mealType: string
  ageRange: string
  content: string
  enabled: boolean
}

export interface KnowledgePayload {
  kind: string
  title: string
  source: string
  content: string
  emoji: string
  ageRange: string
  extra: string
  enabled: boolean
}

export interface RulePayload {
  ageId: string
  title: string
  content: string
  seasonings: Array<{ name: string; amount: string }>
  portions: {
    meat: string
    veg: string
    fruit: string
    grain: string
    default: string
  }
  enabled: boolean
}

export async function listRecipes(): Promise<Recipe[]> {
  return callAdmin<Recipe[]>('listRecipes')
}

export async function createRecipe(payload: RecipePayload): Promise<Recipe> {
  return callAdmin<Recipe>('createRecipe', { ...payload })
}

export async function updateRecipe(id: string, payload: RecipePayload): Promise<Recipe> {
  return callAdmin<Recipe>('updateRecipe', { id, ...payload })
}

export async function deleteRecipe(id: string): Promise<void> {
  await callAdmin<null>('deleteRecipe', { id })
}

export async function listKnowledge(): Promise<KnowledgeItem[]> {
  return callAdmin<KnowledgeItem[]>('listKnowledge')
}

export async function createKnowledge(payload: KnowledgePayload): Promise<KnowledgeItem> {
  return callAdmin<KnowledgeItem>('createKnowledge', { ...payload })
}

export async function updateKnowledge(id: string, payload: KnowledgePayload): Promise<KnowledgeItem> {
  return callAdmin<KnowledgeItem>('updateKnowledge', { id, ...payload })
}

export async function deleteKnowledge(id: string): Promise<void> {
  await callAdmin<null>('deleteKnowledge', { id })
}

export async function listRules(): Promise<RecommendRule[]> {
  return callAdmin<RecommendRule[]>('listRules')
}

export async function createRule(payload: RulePayload): Promise<RecommendRule> {
  return callAdmin<RecommendRule>('createRule', { ...payload })
}

export async function updateRule(id: string, payload: RulePayload): Promise<RecommendRule> {
  return callAdmin<RecommendRule>('updateRule', { id, ...payload })
}

export async function deleteRule(id: string): Promise<void> {
  await callAdmin<null>('deleteRule', { id })
}

export async function listLogs(): Promise<OperationLog[]> {
  return callAdmin<OperationLog[]>('listLogs')
}
