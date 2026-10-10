const { initCloud } = require('./cloud')
const { ENV_ID } = require('../config/cloud')
const { CATEGORIES } = require('./desensitizeFoods')

const CATEGORY_EMOJIS = {
  grain: '🌾',
  veg: '🥬',
  fruit: '🍎',
  meat: '🥩',
  seafood: '🦐',
  egg_dairy: '🥚',
  bean: '🫘',
}

const CACHE_KEY = 'tuanzi_catalog_v1'
const CACHE_TTL_MS = 10 * 60 * 1000

function hasCategories(data) {
  return Boolean(data && Array.isArray(data.categories) && data.categories.length)
}

function readCache() {
  try {
    const raw = wx.getStorageSync(CACHE_KEY)
    if (!raw) return null
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!data || !Array.isArray(data.categories) || !Array.isArray(data.foods)) return null
    return data
  } catch (error) {
    return null
  }
}

function writeCache(catalog) {
  if (!hasCategories(catalog)) return
  wx.setStorageSync(CACHE_KEY, {
    fetchedAt: Date.now(),
    categories: catalog.categories,
    foods: catalog.foods,
  })
}

function clearCatalogCache() {
  try {
    wx.removeStorageSync(CACHE_KEY)
  } catch (error) {
    // ignore
  }
}

function isFresh(cache) {
  return Boolean(hasCategories(cache) && cache.fetchedAt && Date.now() - cache.fetchedAt < CACHE_TTL_MS)
}

function unwrapResult(res) {
  let result = res && res.result
  if (result == null) {
    throw new Error((res && res.errMsg) || '云函数未返回结果')
  }
  for (let i = 0; i < 3; i += 1) {
    if (typeof result === 'string') {
      result = JSON.parse(result)
      continue
    }
    if (result && typeof result.body === 'string') {
      result = JSON.parse(result.body)
      continue
    }
    if (result && result.body && typeof result.body === 'object') {
      result = result.body
      continue
    }
    if (result && result.result && typeof result.result === 'object' && !Array.isArray(result.result)) {
      result = result.result
      continue
    }
    break
  }
  return result
}

async function requestCatalog() {
  initCloud()
  if (!wx.cloud || !wx.cloud.callFunction) {
    throw new Error('当前基础库不支持云开发，无法加载食材目录')
  }
  let res
  try {
    res = await wx.cloud.callFunction({
      name: 'adminApi',
      config: { env: ENV_ID },
      data: { action: 'catalogList' },
    })
  } catch (error) {
    const message = (error && (error.errMsg || error.message)) || '调用云函数失败'
    throw new Error(message)
  }
  console.log('[catalog] callFunction', {
    errMsg: res && res.errMsg,
    resultType: typeof (res && res.result),
  })
  const result = unwrapResult(res)
  if (!result || result.ok !== true || !result.data) {
    throw new Error((result && result.message) || '云端食材数据加载失败')
  }
  if (!Array.isArray(result.data.categories) || !Array.isArray(result.data.foods)) {
    throw new Error('云端食材数据格式不正确')
  }
  return result.data
}

async function fetchCatalog(options) {
  const force = Boolean(options && options.force)
  const cache = readCache()
  if (!force && isFresh(cache)) {
    return {
      categories: cache.categories,
      foods: cache.foods,
      fromCache: true,
      stale: false,
      stats: { categoryTotal: cache.categories.length, foodTotal: cache.foods.length },
    }
  }

  try {
    const data = await requestCatalog()
    writeCache(data)
    return {
      categories: data.categories,
      foods: data.foods,
      fromCache: false,
      stale: false,
      stats: data.stats || {
        categoryTotal: data.categories.length,
        foodTotal: data.foods.length,
      },
    }
  } catch (error) {
    if (hasCategories(cache)) {
      error.cached = {
        categories: cache.categories,
        foods: cache.foods,
        stale: true,
      }
    }
    throw error
  }
}

function deriveCategories(cloudCategories, foods) {
  if (cloudCategories && cloudCategories.length) return cloudCategories
  const seen = new Set()
  const ids = []
  ;(foods || []).forEach((item) => {
    const id = item && item.categoryId
    if (!id || seen.has(id)) return
    seen.add(id)
    ids.push(id)
  })
  const local = CATEGORIES.reduce((map, item) => {
    map[item.id] = item
    return map
  }, {})
  return ids.map((id, index) => {
    const known = local[id]
    return {
      id,
      name: known ? known.name : id,
      emoji: CATEGORY_EMOJIS[id] || '🥗',
      sort: (index + 1) * 10,
      enabled: true,
      isSystem: Boolean(known),
    }
  })
}

function categoryMapFrom(categories) {
  return (categories || []).reduce((map, item) => {
    map[item.id] = item.name
    return map
  }, {})
}

function listFoodsFrom(foods, categories, categoryId, filter, allergyNames, eatenNames) {
  const allergic = new Set(allergyNames || [])
  const eaten = new Set(eatenNames || [])
  const names = categoryMapFrom(categories)
  let items = (foods || []).filter((item) => String(item.categoryId) === String(categoryId) && item.enabled !== false)

  if (filter === 'uneaten') {
    items = items.filter((item) => !eaten.has(item.name))
  } else if (filter === 'eaten') {
    items = items.filter((item) => eaten.has(item.name))
  } else if (filter === 'allergic') {
    items = items.filter((item) => allergic.has(item.name))
  }

  return items.map((item) =>
    Object.assign({}, item, {
      categoryName: names[item.categoryId] || '',
      allergic: allergic.has(item.name),
      eaten: eaten.has(item.name),
    })
  )
}

function findFoodFrom(foods, categories, name) {
  const item = (foods || []).find((food) => food.name === name)
  if (!item) return null
  const names = categoryMapFrom(categories)
  return Object.assign({}, item, { categoryName: names[item.categoryId] || '' })
}

function foodsToIngredients(foods, categories) {
  const names = categoryMapFrom(categories)
  return (foods || [])
    .filter((item) => item.enabled !== false)
    .map((item) => ({
      emoji: item.emoji,
      name: item.name,
      category: names[item.categoryId] || item.categoryId,
    }))
}

module.exports = {
  fetchCatalog,
  deriveCategories,
  readCache,
  listFoodsFrom,
  findFoodFrom,
  foodsToIngredients,
  categoryMapFrom,
  clearCatalogCache,
}
