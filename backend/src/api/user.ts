import type { BabyListResult, BabyQuery, BabyUserDetail } from '@/types'
import { callAdmin } from './client'

export async function listBabies(query: BabyQuery): Promise<BabyListResult> {
  return callAdmin<BabyListResult>('listBabies', {
    keyword: query.keyword || '',
    hideDefault: Boolean(query.hideDefault),
    page: query.page,
    pageSize: query.pageSize,
  })
}

export async function getBaby(id: string): Promise<BabyUserDetail> {
  return callAdmin<BabyUserDetail>('getBaby', { id })
}
