const { initCloud } = require('./cloud')
const { ENV_ID } = require('../config/cloud')

const CACHE_KEY = 'tuanzi_rules_v2'
const CACHE_TTL_MS = 10 * 60 * 1000

const LOCAL_RULES = {
  '6-8': '以小月龄为主：尽量不加调料，必要时仅可用极少量植物油；禁止盐、糖、酱油、蜂蜜。',
  '8-10': '仍以原味为主，可加极少量植物油；不建议盐、糖、酱油。',
  '10-12': '可极少量盐或儿童酱油，可搭配葱姜去腥；不建议糖。',
  '1-2': '可少量盐、儿童酱油、葱姜、植物油、芝麻等，根据菜品灵活搭配，每种注明克数或勺数。',
  '2-3': '以幼儿餐为主：可少量盐、儿童酱油、葱姜、植物油等调味，口味仍宜清淡，注明具体克数或勺数。',
  '4-5': '可参考儿童餐口味，允许少量盐、酱油、番茄、香醋等调味；避免辛辣重口，注明具体用量。',
  '6-7': '接近学龄儿童，可做家庭餐简化版，少量盐和常见家常调味可用，但仍需控制油盐糖并注明具体用量。',
}

const LOCAL_SEASONINGS = {
  '6-8': [
    { name: '盐', amount: '不建议添加（0克）' },
    { name: '糖', amount: '不建议添加' },
    { name: '酱油', amount: '不建议添加' },
  ],
  '8-10': [
    { name: '盐', amount: '极少量，约0.2克' },
    { name: '糖', amount: '不建议添加' },
    { name: '酱油', amount: '不建议添加' },
  ],
  '10-12': [
    { name: '盐', amount: '少许，约0.5克' },
    { name: '糖', amount: '不建议添加' },
    { name: '酱油', amount: '极少量，约2ml' },
  ],
  '1-2': [
    { name: '盐', amount: '少许，约0.8克' },
    { name: '糖', amount: '极少量，约1克' },
    { name: '酱油', amount: '半勺，约3ml' },
  ],
  '2-3': [
    { name: '盐', amount: '少许，约1克' },
    { name: '糖', amount: '半茶匙以内，约1.5克' },
    { name: '酱油', amount: '1勺以内，约4ml' },
  ],
  '4-5': [
    { name: '盐', amount: '少许，约1.5克' },
    { name: '糖', amount: '半茶匙，约2克' },
    { name: '酱油', amount: '1勺，约5ml' },
  ],
  '6-7': [
    { name: '盐', amount: '约2克以内' },
    { name: '糖', amount: '半茶匙到1茶匙，约2-3克' },
    { name: '酱油', amount: '1勺到1.5勺，约5-8ml' },
  ],
}

const LOCAL_PORTIONS = {
  '6-8': { meat: '10g', veg: '15g', fruit: '15g', grain: '20g', default: '15g' },
  '8-10': { meat: '15g', veg: '20g', fruit: '20g', grain: '25g', default: '20g' },
  '10-12': { meat: '20g', veg: '25g', fruit: '25g', grain: '30g', default: '25g' },
  '1-2': { meat: '25g', veg: '30g', fruit: '30g', grain: '35g', default: '30g' },
  '2-3': { meat: '30g', veg: '35g', fruit: '35g', grain: '40g', default: '35g' },
  '4-5': { meat: '40g', veg: '45g', fruit: '45g', grain: '50g', default: '45g' },
  '6-7': { meat: '50g', veg: '55g', fruit: '55g', grain: '60g', default: '55g' },
}

let memory = []

function readCache() {
  try {
    const raw = wx.getStorageSync(CACHE_KEY)
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!data || !Array.isArray(data.rules)) return null
    return data
  } catch (error) {
    return null
  }
}

function applyRules(list) {
  if (!Array.isArray(list) || !list.length) return
  memory = list
  wx.setStorageSync(CACHE_KEY, { fetchedAt: Date.now(), rules: list })
}

function loadCachedRules() {
  const cache = readCache()
  if (cache && cache.rules.length) memory = cache.rules
  return memory
}

function getRulesForAge(ageId) {
  if (!memory.length) loadCachedRules()
  return memory.filter((item) => item && item.enabled !== false && item.ageId === ageId)
}

function getAgeSeasoningRule(ageId) {
  const matched = getRulesForAge(ageId).filter((item) => item.content || item.title)
  if (matched.length) {
    return matched.map((item) => item.content || item.title).join(' ')
  }
  return LOCAL_RULES[ageId] || LOCAL_RULES['8-10']
}

function getAgeSeasoningHints(ageId) {
  for (const item of getRulesForAge(ageId)) {
    if (Array.isArray(item.seasonings) && item.seasonings.length) {
      return item.seasonings
        .map((row) => ({
          name: String((row && (row.name || row.label)) || '').trim(),
          amount: String((row && row.amount) || '').trim(),
        }))
        .filter((row) => row.name)
    }
  }
  return LOCAL_SEASONINGS[ageId] || LOCAL_SEASONINGS['8-10']
}

function getAgePortions(ageId) {
  for (const item of getRulesForAge(ageId)) {
    const portions = item.portions || {}
    if (portions.meat || portions.veg || portions.fruit || portions.grain || portions.default) {
      return {
        meat: portions.meat || '',
        veg: portions.veg || '',
        fruit: portions.fruit || '',
        grain: portions.grain || '',
        default: portions.default || '',
      }
    }
  }
  return LOCAL_PORTIONS[ageId] || LOCAL_PORTIONS['8-10']
}

async function loadRecommendRules() {
  loadCachedRules()
  const cache = readCache()
  if (cache && cache.fetchedAt && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return memory
  }

  initCloud()
  if (!wx.cloud || !wx.cloud.callFunction) return memory

  const res = await wx.cloud.callFunction({
    name: 'adminApi',
    config: { env: ENV_ID },
    data: { action: 'catalogRules' },
  })
  let result = res && res.result
  if (result && result.body && typeof result.body === 'object') result = result.body
  if (!result || result.ok !== true || !Array.isArray(result.data)) {
    throw new Error((result && result.message) || '云端推荐规则加载失败')
  }
  applyRules(result.data)
  return memory
}

module.exports = {
  LOCAL_RULES,
  LOCAL_SEASONINGS,
  LOCAL_PORTIONS,
  getAgeSeasoningRule,
  getAgeSeasoningHints,
  getAgePortions,
  loadRecommendRules,
  applyRules,
}
