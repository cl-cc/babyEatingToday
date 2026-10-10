export const SYSTEM_CATEGORY_IDS = [
  'grain',
  'veg',
  'fruit',
  'meat',
  'seafood',
  'egg_dairy',
  'bean',
] as const

export type SystemCategoryId = (typeof SYSTEM_CATEGORY_IDS)[number]

export interface Category {
  id: string
  name: string
  emoji: string
  sort: number
  enabled: boolean
  isSystem: boolean
  updatedAt: string
}

export interface Food {
  id: string
  name: string
  emoji: string
  categoryId: string
  subCategory: string
  enabled: boolean
  sort: number
  createdAt: string
  updatedAt: string
}

export interface FoodQuery {
  name?: string
  categoryId?: string
  enabled?: boolean | ''
  page: number
  pageSize: number
}

export interface FoodPayload {
  name: string
  emoji: string
  categoryId: string
  subCategory: string
  enabled: boolean
  sort: number
}

export interface CategoryPayload {
  id?: string
  name: string
  emoji: string
  sort: number
  enabled: boolean
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface Recipe {
  id: string
  name: string
  mealType: string
  ageRange: string
  content: string
  enabled: boolean
  updatedAt: string
}

export interface KnowledgeItem {
  id: string
  kind: string
  title: string
  source: string
  content: string
  emoji: string
  ageRange: string
  extra: string
  enabled: boolean
  updatedAt: string
}

export interface RecommendRule {
  id: string
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
  updatedAt: string
}

export interface AdminUser {
  id: string
  username: string
  displayName: string
  role: string
}

export interface OperationLog {
  id: string
  operator: string
  action: string
  target: string
  createdAt: string
}

export interface DashboardStats {
  foodCount: number
  foodEnabledCount?: number
  recipeCount: number
  knowledgeCount: number
  categoryCount: number
  categoryStats: Array<{ name: string; value: number }>
  recentUpdates: Array<{
    id: string
    title: string
    type: string
    updatedAt: string
  }>
  foodTrend?: {
    days: Array<{ date: string; label: string }>
    series: Array<{ name: string; data: number[] }>
  }
  subCategoryStats?: Array<{ name: string; value: number }>
  knowledgeKindStats?: Array<{ name: string; value: number }>
  recipeAgeStats?: Array<{ name: string; value: number }>
  userAgeStats?: Array<{ name: string; value: number }>
  userCount?: number
}

export interface BabyUser {
  id: string
  openid: string
  name: string
  gender: string
  ageId: string
  ageMonths: number
  birthDate: string
  allergyCount: number
  eatenCount: number
  fridgeCount: number
  checkInCount: number
  allergies: string[]
  isDefault: boolean
  updatedAt: string
  aiSynced: boolean
  aiLimit: number
  aiUsed: number
  aiRemain: number | null
  aiQuotaDate: string
}

export interface BabyUserDetail extends BabyUser {
  dislikes: string[]
  fridge: string[]
  eatenFoods: string[]
  checkInDates: string[]
}

export interface BabySummary {
  total: number
  withAllergies: number
  withEaten: number
  checkedIn: number
  defaultOnly: number
}

export interface BabyQuery {
  keyword?: string
  hideDefault?: boolean
  page: number
  pageSize: number
}

export interface BabyListResult extends PageResult<BabyUser> {
  summary: BabySummary
}

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  user: AdminUser
}
