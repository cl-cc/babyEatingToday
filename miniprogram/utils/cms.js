const { initCloud } = require('./cloud')
const { ENV_ID } = require('../config/cloud')

const CACHE_KEY = 'tuanzi_content_v1'
const CACHE_TTL_MS = 10 * 60 * 1000

const AGE_IDS = ['6-8', '8-10', '10-12', '1-2', '2-3', '4-5', '6-7']

let memory = { knowledge: [], recipes: [] }

function readCache() {
  try {
    const raw = wx.getStorageSync(CACHE_KEY)
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!data || !Array.isArray(data.knowledge) || !Array.isArray(data.recipes)) return null
    return data
  } catch (error) {
    return null
  }
}

function applyContent(payload) {
  if (!payload) return
  memory = {
    knowledge: Array.isArray(payload.knowledge) ? payload.knowledge : [],
    recipes: Array.isArray(payload.recipes) ? payload.recipes : [],
  }
  wx.setStorageSync(CACHE_KEY, {
    fetchedAt: Date.now(),
    knowledge: memory.knowledge,
    recipes: memory.recipes,
  })
}

function loadCachedContent() {
  const cache = readCache()
  if (cache) {
    memory = {
      knowledge: cache.knowledge,
      recipes: cache.recipes,
    }
  }
  return memory
}

function unwrapResult(res) {
  let result = res && res.result
  if (result && result.body && typeof result.body === 'object') result = result.body
  return result
}

async function loadCatalogContent() {
  loadCachedContent()
  const cache = readCache()
  if (cache && cache.fetchedAt && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return memory
  }

  initCloud()
  if (!wx.cloud || !wx.cloud.callFunction) return memory

  const res = await wx.cloud.callFunction({
    name: 'adminApi',
    config: { env: ENV_ID },
    data: { action: 'catalogContent' },
  })
  const result = unwrapResult(res)
  if (!result || result.ok !== true || !result.data) {
    throw new Error((result && result.message) || '云端内容加载失败')
  }
  applyContent(result.data)
  return memory
}

function listKnowledge(kind) {
  if (!memory.knowledge.length) loadCachedContent()
  const kinds = Array.isArray(kind) ? kind : kind ? [kind] : []
  return memory.knowledge.filter((item) => {
    if (!item || item.enabled === false) return false
    if (!kinds.length) return true
    return kinds.includes(item.kind)
  })
}

function listRecipes(ageId) {
  if (!memory.recipes.length) loadCachedContent()
  return memory.recipes.filter((item) => {
    if (!item || item.enabled === false) return false
    if (!ageId) return true
    return normalizeAgeRange(item.ageRange) === ageId
  })
}

function normalizeAgeRange(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (AGE_IDS.includes(raw)) return raw
  const stripped = raw.replace(/个月|月龄|岁/g, '').replace(/\s/g, '')
  return AGE_IDS.includes(stripped) ? stripped : raw
}

function splitAges(value) {
  return String(value || '')
    .split(/[,，]/)
    .map((item) => normalizeAgeRange(item))
    .filter(Boolean)
}

function getTipTexts() {
  return listKnowledge(['tip', 'nutrition']).map((item) => item.title).filter(Boolean)
}

function getSuggestionPool() {
  return listKnowledge('suggestion').map((item) => {
    let leadText = '今天推荐'
    let actionText = '尝试'
    const raw = String(item.content || '').trim()
    if (raw.startsWith('{')) {
      try {
        const parsed = JSON.parse(raw)
        leadText = parsed.leadText || leadText
        actionText = parsed.actionText != null ? parsed.actionText : actionText
      } catch (error) {
        leadText = raw || leadText
      }
    } else if (raw) {
      leadText = raw
    }
    if (leadText === '今天试试') actionText = ''
    const ages = splitAges(item.ageRange)
    return {
      leadText,
      actionText,
      emoji: item.emoji || '🥗',
      food: item.title,
      ages: ages.length ? ages : AGE_IDS,
    }
  })
}

function getNutritionTags() {
  return listKnowledge('tag')
    .map((item) => ({
      label: item.title,
      emoji: item.emoji || '🥗',
      keywords: String(item.extra || '')
        .split(/[,，]/)
        .map((kw) => kw.trim())
        .filter(Boolean),
    }))
    .filter((item) => item.label)
}

function getAuthorityAdvice() {
  return listKnowledge('authority')
    .map((item) => {
      let payload = {}
      try {
        payload = item.content ? JSON.parse(item.content) : {}
      } catch (error) {
        payload = { whoAdvice: item.content || '', aapAdvice: '' }
      }
      return {
        title: item.title,
        keywords: String(item.extra || '')
          .split(/[,，]/)
          .map((kw) => kw.trim())
          .filter(Boolean),
        can: payload.can == null ? '' : payload.can,
        whoAdvice: payload.whoAdvice || '',
        aapAdvice: payload.aapAdvice || '',
      }
    })
    .filter((item) => item.whoAdvice || item.aapAdvice)
}

function getHotTags() {
  return listKnowledge('hot')
    .map((item) => ({
      name: item.title,
      emoji: item.emoji || '🥗',
      type: item.extra || item.source || '',
    }))
    .filter((item) => item.name)
}

function getCanEatItems() {
  return listKnowledge('can-eat')
    .map((item) => {
      let rules = null
      try {
        rules = item.content ? JSON.parse(item.content) : null
      } catch (error) {
        rules = null
      }
      if (!rules || typeof rules !== 'object') return null
      const keywords = String(item.extra || '')
        .split(/[,，]/)
        .map((kw) => kw.trim())
        .filter(Boolean)
      return {
        name: item.title,
        emoji: item.emoji || '🥗',
        keywords: keywords.length ? keywords : [item.title],
        rules,
      }
    })
    .filter(Boolean)
}

function recipeToSet(recipe) {
  const raw = String(recipe.content || '').trim()
  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed.foods) && parsed.foods.length) {
        return {
          foods: parsed.foods,
          seasonings: parsed.seasonings || [],
          stars: Number(parsed.stars) || 4,
        }
      }
    } catch (error) {
      // fall through
    }
  }
  return {
    foods: [{ emoji: '🍽️', name: recipe.name }],
    seasonings: [],
    stars: 4,
    note: raw,
  }
}

function getRecipeSets(ageId) {
  return listRecipes(ageId).map(recipeToSet)
}

module.exports = {
  loadCatalogContent,
  loadCachedContent,
  listKnowledge,
  listRecipes,
  getTipTexts,
  getSuggestionPool,
  getHotTags,
  getNutritionTags,
  getAuthorityAdvice,
  getCanEatItems,
  getRecipeSets,
  normalizeAgeRange,
}
