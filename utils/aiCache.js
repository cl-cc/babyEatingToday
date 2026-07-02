const CACHE_PREFIX = 'ai_cache_'

const TYPES = {
  TODAY_RECOMMEND: 'today_recommend',
  TODAY_SUGGESTION: 'today_suggestion',
  CAN_EAT_HOT: 'can_eat_hot',
  CAN_EAT_QUERY: 'can_eat_query',
  WEEKLY_MENU: 'weekly_menu',
  COMBINE_PICK: 'combine_pick',
  COMBINE_FRIDGE: 'combine_fridge',
}

const TTL = {
  TODAY_RECOMMEND: 24 * 60 * 60 * 1000,
  TODAY_SUGGESTION: 24 * 60 * 60 * 1000,
  CAN_EAT_HOT: 7 * 24 * 60 * 60 * 1000,
  CAN_EAT_QUERY: 30 * 24 * 60 * 60 * 1000,
}

const MAX_ENTRIES = {
  [TYPES.CAN_EAT_QUERY]: 80,
}

const memory = {}

function readBucket(type) {
  if (memory[type]) return memory[type]
  try {
    memory[type] = wx.getStorageSync(CACHE_PREFIX + type) || {}
  } catch (e) {
    memory[type] = {}
  }
  return memory[type]
}

function writeBucket(type, bucket) {
  memory[type] = bucket
  try {
    wx.setStorageSync(CACHE_PREFIX + type, bucket)
  } catch (e) {
    console.warn('[aiCache] 写入失败，尝试裁剪后重试', type, e)
    trimBucket(bucket, Math.max(10, (MAX_ENTRIES[type] || 20) - 10))
    try {
      wx.setStorageSync(CACHE_PREFIX + type, bucket)
    } catch (err) {
      console.error('[aiCache] 写入仍失败', type, err)
    }
  }
}

function trimBucket(bucket, maxEntries) {
  const keys = Object.keys(bucket)
  if (keys.length <= maxEntries) return
  keys
    .sort((a, b) => (bucket[a].savedAt || 0) - (bucket[b].savedAt || 0))
    .slice(0, keys.length - maxEntries)
    .forEach((key) => {
      delete bucket[key]
    })
}

function getEntry(type, key, ttl) {
  const bucket = readBucket(type)
  const entry = bucket[key]
  if (!entry) return null
  if (ttl > 0 && Date.now() - entry.savedAt > ttl) {
    delete bucket[key]
    writeBucket(type, bucket)
    return null
  }
  return entry.data
}

function setEntry(type, key, data, ttl) {
  const bucket = readBucket(type)
  bucket[key] = { data, savedAt: Date.now() }
  const max = MAX_ENTRIES[type]
  if (max) trimBucket(bucket, max)
  writeBucket(type, bucket)
  return data
}

function removeEntry(type, key) {
  const bucket = readBucket(type)
  if (!bucket[key]) return
  delete bucket[key]
  writeBucket(type, bucket)
}

function getTodayDateKey() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function normalizeQueryKey(query) {
  return String(query || '')
    .trim()
    .toLowerCase()
}

function getTodayRecommend(ageId) {
  const key = `${ageId}_${getTodayDateKey()}`
  return getEntry(TYPES.TODAY_RECOMMEND, key, TTL.TODAY_RECOMMEND)
}

function setTodayRecommend(ageId, data) {
  const key = `${ageId}_${getTodayDateKey()}`
  return setEntry(TYPES.TODAY_RECOMMEND, key, Object.assign({}, data, { ageId }))
}

function clearTodayRecommend(ageId) {
  const key = `${ageId}_${getTodayDateKey()}`
  removeEntry(TYPES.TODAY_RECOMMEND, key)
}

function getTodaySuggestion(ageId, gender) {
  const key = `${ageId}_${gender || 'unknown'}_${getTodayDateKey()}`
  return getEntry(TYPES.TODAY_SUGGESTION, key, TTL.TODAY_SUGGESTION)
}

function setTodaySuggestion(ageId, gender, data) {
  const key = `${ageId}_${gender || 'unknown'}_${getTodayDateKey()}`
  return setEntry(TYPES.TODAY_SUGGESTION, key, Object.assign({}, data, { ageId, gender }))
}

function clearTodaySuggestion(ageId, gender) {
  const key = `${ageId}_${gender || 'unknown'}_${getTodayDateKey()}`
  removeEntry(TYPES.TODAY_SUGGESTION, key)
}

function getCanEatHot(ageId) {
  return getEntry(TYPES.CAN_EAT_HOT, ageId, TTL.CAN_EAT_HOT)
}

function setCanEatHot(ageId, list) {
  return setEntry(TYPES.CAN_EAT_HOT, ageId, list)
}

function getCanEatQuery(ageId, query) {
  const q = normalizeQueryKey(query)
  if (!q) return null
  return getEntry(TYPES.CAN_EAT_QUERY, `${ageId}|${q}`, TTL.CAN_EAT_QUERY)
}

function setCanEatQuery(ageId, query, data) {
  const q = normalizeQueryKey(query)
  if (!q) return null
  return setEntry(TYPES.CAN_EAT_QUERY, `${ageId}|${q}`, data)
}

function getWeeklyMenu(ageId) {
  return getEntry(TYPES.WEEKLY_MENU, ageId || '8-10', 0)
}

function setWeeklyMenu(ageId, menu) {
  return setEntry(TYPES.WEEKLY_MENU, ageId || '8-10', menu)
}

function getCombinePick(ageId) {
  return getEntry(TYPES.COMBINE_PICK, ageId || '8-10', 0)
}

function setCombinePick(ageId, data) {
  return setEntry(TYPES.COMBINE_PICK, ageId || '8-10', data)
}

function getCombineFridge(ageId) {
  return getEntry(TYPES.COMBINE_FRIDGE, ageId || '8-10', 0)
}

function setCombineFridge(ageId, data) {
  return setEntry(TYPES.COMBINE_FRIDGE, ageId || '8-10', data)
}

function clearCombinePick(ageId) {
  removeEntry(TYPES.COMBINE_PICK, ageId || '8-10')
}

function clearCombineFridge(ageId) {
  removeEntry(TYPES.COMBINE_FRIDGE, ageId || '8-10')
}

module.exports = {
  TYPES,
  TTL,
  getTodayRecommend,
  setTodayRecommend,
  clearTodayRecommend,
  getTodaySuggestion,
  setTodaySuggestion,
  clearTodaySuggestion,
  getCanEatHot,
  setCanEatHot,
  getCanEatQuery,
  setCanEatQuery,
  getWeeklyMenu,
  setWeeklyMenu,
  getCombinePick,
  setCombinePick,
  getCombineFridge,
  setCombineFridge,
  clearCombinePick,
  clearCombineFridge,
}
