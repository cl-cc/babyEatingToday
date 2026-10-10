'use strict'

// 小程序：wx.cloud.callFunction
// Web 后台：微信云开发 Web SDK 未登录模式 callFunction
// 免费 cloud1 环境通常没有 HTTP 访问入口，不再依赖 HTTP 触发器

const cloud = require('wx-server-sdk')
const crypto = require('crypto')
const seed = require('./seed.json')
const contentSeed = require('./content-seed.json')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

const COLLECTIONS = {
  categories: 'categories',
  foods: 'foods',
  recipes: 'recipes',
  knowledge: 'knowledge',
  rules: 'rules',
  logs: 'admin_logs',
  babies: 'babies',
}

const PUBLIC_ACTIONS = new Set(['login', 'catalogList', 'catalogRules', 'catalogContent'])

const KNOWLEDGE_KIND_META = {
  tip: { label: '暖心提示', source: '首页提示' },
  nutrition: { label: '营养提示', source: '营养知识' },
  suggestion: { label: '今日建议', source: '首页建议' },
  hot: { label: '热门查询', source: '能不能吃' },
  'can-eat': { label: '能不能吃', source: '能不能吃' },
  tag: { label: '营养标签', source: '营养标签' },
  authority: { label: '权威建议', source: 'WHO/AAP' },
  article: { label: '喂养说明', source: '喂养知识' },
}

const DEFAULT_AGE_RULES = [
  {
    ageId: '6-8',
    title: '6-8个月调味与质地',
    content: '以小月龄为主：尽量不加调料，必要时仅可用极少量植物油；禁止盐、糖、酱油、蜂蜜。',
    seasonings: [
      { name: '盐', amount: '不建议添加（0克）' },
      { name: '糖', amount: '不建议添加' },
      { name: '酱油', amount: '不建议添加' },
    ],
    portions: { meat: '10g', veg: '15g', fruit: '15g', grain: '20g', default: '15g' },
  },
  {
    ageId: '8-10',
    title: '8-10个月调味与质地',
    content: '仍以原味为主，可加极少量植物油；不建议盐、糖、酱油。',
    seasonings: [
      { name: '盐', amount: '极少量，约0.2克' },
      { name: '糖', amount: '不建议添加' },
      { name: '酱油', amount: '不建议添加' },
    ],
    portions: { meat: '15g', veg: '20g', fruit: '20g', grain: '25g', default: '20g' },
  },
  {
    ageId: '10-12',
    title: '10-12个月调味与质地',
    content: '可极少量盐或儿童酱油，可搭配葱姜去腥；不建议糖。',
    seasonings: [
      { name: '盐', amount: '少许，约0.5克' },
      { name: '糖', amount: '不建议添加' },
      { name: '酱油', amount: '极少量，约2ml' },
    ],
    portions: { meat: '20g', veg: '25g', fruit: '25g', grain: '30g', default: '25g' },
  },
  {
    ageId: '1-2',
    title: '1-2岁调味与质地',
    content: '可少量盐、儿童酱油、葱姜、植物油、芝麻等，根据菜品灵活搭配，每种注明克数或勺数。',
    seasonings: [
      { name: '盐', amount: '少许，约0.8克' },
      { name: '糖', amount: '极少量，约1克' },
      { name: '酱油', amount: '半勺，约3ml' },
    ],
    portions: { meat: '25g', veg: '30g', fruit: '30g', grain: '35g', default: '30g' },
  },
  {
    ageId: '2-3',
    title: '2-3岁调味与质地',
    content: '以幼儿餐为主：可少量盐、儿童酱油、葱姜、植物油等调味，口味仍宜清淡，注明具体克数或勺数。',
    seasonings: [
      { name: '盐', amount: '少许，约1克' },
      { name: '糖', amount: '半茶匙以内，约1.5克' },
      { name: '酱油', amount: '1勺以内，约4ml' },
    ],
    portions: { meat: '30g', veg: '35g', fruit: '35g', grain: '40g', default: '35g' },
  },
  {
    ageId: '4-5',
    title: '4-5岁调味与质地',
    content: '可参考儿童餐口味，允许少量盐、酱油、番茄、香醋等调味；避免辛辣重口，注明具体用量。',
    seasonings: [
      { name: '盐', amount: '少许，约1.5克' },
      { name: '糖', amount: '半茶匙，约2克' },
      { name: '酱油', amount: '1勺，约5ml' },
    ],
    portions: { meat: '40g', veg: '45g', fruit: '45g', grain: '50g', default: '45g' },
  },
  {
    ageId: '6-7',
    title: '6-7岁调味与质地',
    content: '接近学龄儿童，可做家庭餐简化版，少量盐和常见家常调味可用，但仍需控制油盐糖并注明具体用量。',
    seasonings: [
      { name: '盐', amount: '约2克以内' },
      { name: '糖', amount: '半茶匙到1茶匙，约2-3克' },
      { name: '酱油', amount: '1勺到1.5勺，约5-8ml' },
    ],
    portions: { meat: '50g', veg: '55g', fruit: '55g', grain: '60g', default: '55g' },
  },
]
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000
const SYSTEM_CATEGORY_IDS = new Set([
  'grain',
  'veg',
  'fruit',
  'meat',
  'seafood',
  'egg_dairy',
  'bean',
])

const CORS_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function nowIso() {
  return new Date().toISOString()
}

function ok(data) {
  return { ok: true, data }
}

function fail(message) {
  return { ok: false, message }
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a))
  const right = Buffer.from(String(b))
  if (left.length !== right.length) return false
  return crypto.timingSafeEqual(left, right)
}

function getAuthConfig() {
  const username = process.env.ADMIN_USERNAME
  const password = process.env.ADMIN_PASSWORD
  const secret = process.env.ADMIN_TOKEN_SECRET
  const missing = []
  if (!username) missing.push('ADMIN_USERNAME')
  if (!password) missing.push('ADMIN_PASSWORD')
  if (!secret) missing.push('ADMIN_TOKEN_SECRET')
  if (missing.length) {
    return { missing }
  }
  return { username, password, secret }
}

function authConfigError(config) {
  if (config && !config.missing) return ''
  const names = (config && config.missing) || ['ADMIN_USERNAME', 'ADMIN_PASSWORD', 'ADMIN_TOKEN_SECRET']
  return `云函数环境变量缺少：${names.join('、')}。请填写后重新部署 adminApi。`
}

function signToken(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64')
  const sig = crypto.createHmac('sha256', secret).update(body).digest('hex')
  return `${body}.${sig}`
}

function verifyToken(token, secret) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null
  const [body, sig] = token.split('.')
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
  if (!safeEqual(sig, expected)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64').toString('utf8'))
    if (!payload || !payload.exp || payload.exp < Date.now()) return null
    return payload
  } catch (error) {
    return null
  }
}

function nextId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`
}

function isHttpEvent(event) {
  const method = event && event.httpMethod
  return typeof method === 'string' && /^(GET|POST|PUT|DELETE|OPTIONS|PATCH)$/i.test(method)
}

function parseInput(event) {
  if (event && typeof event.action === 'string' && event.action) {
    return event
  }

  let input = {}
  if (event && typeof event.body === 'string') {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : event.body
    input = raw ? JSON.parse(raw) : {}
  } else if (event && event.body && typeof event.body === 'object') {
    input = event.body
  } else {
    input = event || {}
  }

  const headers = (event && event.headers) || {}
  const auth = headers.Authorization || headers.authorization || ''
  if (typeof auth === 'string' && auth.startsWith('Bearer ') && !input.token) {
    input.token = auth.slice(7)
  }
  return input
}

const ensuredCollections = new Set()

function isMissingCollection(error) {
  const text = String((error && (error.message || error.errMsg)) || error || '')
  return Boolean(error && (error.errCode === -502005 || /COLLECTION_NOT_EXIST|collection not exist/i.test(text)))
}

function isCollectionExistsError(error) {
  const text = String((error && (error.message || error.errMsg)) || error || '')
  return Boolean(
    error &&
      (error.errCode === -501001 ||
        error.errCode === -502002 ||
        /COLLECTION_EXIST|already exist|already exists/i.test(text)),
  )
}

async function ensureCollection(name) {
  if (ensuredCollections.has(name)) return
  try {
    await db.createCollection(name)
  } catch (error) {
    if (!isCollectionExistsError(error)) {
      throw error
    }
  }
  ensuredCollections.add(name)
}

async function addDoc(name, data) {
  await ensureCollection(name)
  try {
    return await db.collection(name).add({ data })
  } catch (error) {
    if (!isMissingCollection(error)) throw error
    ensuredCollections.delete(name)
    await ensureCollection(name)
    return db.collection(name).add({ data })
  }
}

async function getAll(name, where) {
  try {
    const pageSize = 100
    let skip = 0
    const list = []
    for (;;) {
      let query = db.collection(name)
      if (where) query = query.where(where)
      if (skip > 0) query = query.skip(skip)
      const res = await query.limit(pageSize).get()
      const rows = (res && res.data) || []
      list.push(...rows)
      if (rows.length < pageSize) break
      skip += pageSize
      if (skip >= 2000) break
    }
    return list
  } catch (error) {
    console.error('[adminApi] getAll', name, error)
    if (isMissingCollection(error)) return []
    throw error
  }
}

async function safeCount(name, where) {
  try {
    const col = db.collection(name)
    const res = await (where ? col.where(where) : col).count()
    return res.total
  } catch (error) {
    if (isMissingCollection(error)) return 0
    throw error
  }
}

async function addInBatches(name, docs, size) {
  await ensureCollection(name)
  const batchSize = size || 20
  for (let i = 0; i < docs.length; i += batchSize) {
    const chunk = docs.slice(i, i + batchSize)
    await Promise.all(chunk.map((data) => addDoc(name, data)))
  }
}

async function writeLog(operator, action, target) {
  await addDoc(COLLECTIONS.logs, {
    operator: operator || 'admin',
    action,
    target,
    createdAt: nowIso(),
  })
}

function toCategory(doc) {
  const id = doc.id || doc._id
  return {
    id,
    name: doc.name,
    emoji: doc.emoji || '🥗',
    sort: Number(doc.sort) || 0,
    enabled: doc.enabled !== false,
    isSystem: Boolean(doc.isSystem) || SYSTEM_CATEGORY_IDS.has(id),
    updatedAt: doc.updatedAt || '',
  }
}

function toFood(doc) {
  return {
    id: doc.id || doc._id,
    name: doc.name,
    emoji: doc.emoji || '🥗',
    categoryId: doc.categoryId,
    subCategory: doc.subCategory || '',
    enabled: doc.enabled !== false,
    sort: Number(doc.sort) || 0,
    createdAt: doc.createdAt || '',
    updatedAt: doc.updatedAt || '',
  }
}

function toRecipe(doc) {
  return {
    id: doc.id || doc._id,
    name: doc.name,
    mealType: doc.mealType || '',
    ageRange: doc.ageRange || '',
    content: doc.content || '',
    enabled: doc.enabled !== false,
    updatedAt: doc.updatedAt || '',
  }
}

function normalizeKind(kind) {
  const value = String(kind || '').trim()
  return KNOWLEDGE_KIND_META[value] ? value : 'article'
}

function toKnowledge(doc) {
  return {
    id: doc.id || doc._id,
    kind: normalizeKind(doc.kind),
    title: doc.title,
    source: doc.source || '',
    content: doc.content || '',
    emoji: doc.emoji || '',
    ageRange: doc.ageRange || '',
    extra: doc.extra || '',
    enabled: doc.enabled !== false,
    updatedAt: doc.updatedAt || '',
  }
}

function knowledgeFields(input) {
  const kind = normalizeKind(input.kind)
  const meta = KNOWLEDGE_KIND_META[kind]
  return {
    kind,
    title: requireText(input.title, '标题', 80),
    source: String(input.source || '').trim() || meta.source,
    content: String(input.content || '').trim(),
    emoji: String(input.emoji || '').trim(),
    ageRange: String(input.ageRange || '').trim(),
    extra: String(input.extra || '').trim(),
    enabled: input.enabled !== false,
  }
}

function normalizeSeasoningList(list) {
  if (!Array.isArray(list)) return []
  return list
    .map((item) => ({
      name: String((item && (item.name || item.label)) || '').trim(),
      amount: String((item && item.amount) || '').trim(),
    }))
    .filter((item) => item.name)
}

function normalizePortions(input) {
  const src = input && typeof input === 'object' ? input : {}
  return {
    meat: String(src.meat || '').trim(),
    veg: String(src.veg || '').trim(),
    fruit: String(src.fruit || '').trim(),
    grain: String(src.grain || '').trim(),
    default: String(src.default || '').trim(),
  }
}

function hasPortions(input) {
  const src = normalizePortions(input)
  return Boolean(src.meat || src.veg || src.fruit || src.grain || src.default)
}

function toRule(doc) {
  return {
    id: doc.id || doc._id,
    ageId: doc.ageId || '',
    title: doc.title,
    content: doc.content || '',
    seasonings: normalizeSeasoningList(doc.seasonings),
    portions: normalizePortions(doc.portions),
    enabled: doc.enabled !== false,
    updatedAt: doc.updatedAt || '',
  }
}

function toLog(doc) {
  return {
    id: doc._id,
    operator: doc.operator,
    action: doc.action,
    target: doc.target,
    createdAt: doc.createdAt || '',
  }
}

function itemNames(list) {
  if (!Array.isArray(list)) return []
  return list
    .map((item) => {
      if (typeof item === 'string') return item.trim()
      if (item && item.name) return String(item.name).trim()
      return ''
    })
    .filter(Boolean)
}

function toTime(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return new Date(value).toISOString()
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object') {
    if (value.$date) return new Date(value.$date).toISOString()
    if (typeof value.getTime === 'function') return new Date(value.getTime()).toISOString()
  }
  return ''
}

const AI_DAILY_LIMIT = 50

function todayShanghai() {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })
  } catch (error) {
    return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10)
  }
}

function toAiQuota(doc) {
  const date = String(doc.aiQuotaDate || '')
  if (!date) {
    return { aiSynced: false, aiLimit: AI_DAILY_LIMIT, aiUsed: 0, aiRemain: null, aiQuotaDate: '' }
  }
  const usedToday = date === todayShanghai() ? Number(doc.aiQuotaCount) || 0 : 0
  return {
    aiSynced: true,
    aiLimit: AI_DAILY_LIMIT,
    aiUsed: usedToday,
    aiRemain: Math.max(0, AI_DAILY_LIMIT - usedToday),
    aiQuotaDate: date,
  }
}

function toBabySummary(doc) {
  const allergies = itemNames(doc.allergies)
  const eatenFoods = itemNames(doc.eatenFoods)
  const fridge = itemNames(doc.fridge)
  const checkInDates = Array.isArray(doc.checkInDates) ? doc.checkInDates.map(String).filter(Boolean) : []
  const name = String(doc.name || '宝贝').trim() || '宝贝'
  const birthDate = String(doc.birthDate || '').trim()
  const isDefault =
    name === '宝贝' && !birthDate && !allergies.length && !eatenFoods.length && !fridge.length && !checkInDates.length
  return {
    id: doc._id,
    openid: doc._openid || '',
    name,
    gender: String(doc.gender || ''),
    ageId: String(doc.ageId || ''),
    ageMonths: Number(doc.ageMonths) || 0,
    birthDate,
    allergyCount: allergies.length,
    eatenCount: eatenFoods.length,
    fridgeCount: fridge.length,
    checkInCount: checkInDates.length,
    allergies,
    isDefault,
    updatedAt: toTime(doc.updatedAt),
    ...toAiQuota(doc),
  }
}

function toBabyDetail(doc) {
  return {
    ...toBabySummary(doc),
    dislikes: itemNames(doc.dislikes),
    fridge: itemNames(doc.fridge),
    eatenFoods: itemNames(doc.eatenFoods),
    checkInDates: Array.isArray(doc.checkInDates) ? doc.checkInDates.map(String).filter(Boolean) : [],
  }
}

async function handleListBabies(input) {
  const page = Math.max(1, Number(input.page) || 1)
  const pageSize = Math.min(50, Math.max(1, Number(input.pageSize) || 10))
  const keyword = String((input && input.keyword) || '').trim().toLowerCase()
  const hideDefault = Boolean(input && input.hideDefault)
  const mapped = (await getAll(COLLECTIONS.babies)).map(toBabySummary)
  const summary = {
    total: mapped.length,
    withAllergies: mapped.filter((item) => item.allergyCount > 0).length,
    withEaten: mapped.filter((item) => item.eatenCount > 0).length,
    checkedIn: mapped.filter((item) => item.checkInCount > 0).length,
    defaultOnly: mapped.filter((item) => item.isDefault).length,
  }
  const filtered = mapped
    .filter((item) => {
      if (hideDefault && item.isDefault) return false
      if (!keyword) return true
      return `${item.name} ${item.openid}`.toLowerCase().indexOf(keyword) >= 0
    })
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
  const start = (page - 1) * pageSize
  return ok({
    list: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
    summary,
  })
}

async function handleGetBaby(input) {
  const id = requireText(input.id, '用户 ID')
  const doc = await requireDoc(COLLECTIONS.babies, id, '用户档案')
  return ok(toBabyDetail(doc))
}

async function requireDoc(collection, id, label) {
  try {
    const res = await db.collection(collection).doc(id).get()
    if (!res.data) throw new Error(`${label}不存在`)
    return res.data
  } catch (error) {
    if (isMissingCollection(error)) throw new Error(`${label}不存在`)
    if (error && error.message && error.message.indexOf('不存在') >= 0) throw error
    throw new Error(`${label}不存在`)
  }
}

function requireText(value, label, max) {
  const text = String(value || '').trim()
  if (!text) throw new Error(`${label}不能为空`)
  if (max && text.length > max) throw new Error(`${label}过长`)
  return text
}

async function handleLogin(input) {
  const config = getAuthConfig()
  if (config.missing) {
    return fail(authConfigError(config))
  }
  const username = String(input.username || '').trim()
  const password = String(input.password || '')
  if (!username || !password) return fail('请输入用户名和密码')
  if (!safeEqual(username, config.username) || !safeEqual(password, config.password)) {
    return fail('用户名或密码错误')
  }
  const user = {
    id: 'admin_001',
    username: config.username,
    displayName: '系统管理员',
    role: 'super',
  }
  const token = signToken(
    {
      sub: user.id,
      username: user.username,
      role: user.role,
      exp: Date.now() + TOKEN_TTL_MS,
    },
    config.secret,
  )
  return ok({ token, user })
}

async function upsertCategoryDoc(item, now) {
  const data = {
    id: item.id,
    name: item.name,
    emoji: item.emoji,
    sort: item.sort,
    enabled: item.enabled !== false,
    isSystem: Boolean(item.isSystem) || SYSTEM_CATEGORY_IDS.has(item.id),
    createdAt: now,
    updatedAt: now,
  }
  await ensureCollection(COLLECTIONS.categories)
  try {
    await db.collection(COLLECTIONS.categories).doc(item.id).set({ data })
  } catch (error) {
    if (!isMissingCollection(error)) throw error
    ensuredCollections.delete(COLLECTIONS.categories)
    await ensureCollection(COLLECTIONS.categories)
    await db.collection(COLLECTIONS.categories).doc(item.id).set({ data })
  }
}

async function ensureMissingSystemCategories() {
  await ensureCollection(COLLECTIONS.categories)
  const existing = await getAll(COLLECTIONS.categories)
  const have = new Set(existing.map((item) => item.id || item._id))
  const now = nowIso()
  const missing = seed.categories.filter((item) => !have.has(item.id))
  for (const item of missing) {
    try {
      await upsertCategoryDoc({ ...item, isSystem: true }, now)
    } catch (error) {
      console.error('[adminApi] ensure category', item.id, error)
    }
  }
  return missing.length
}

function deriveCategoriesFromFoods(foods, existing) {
  if (existing && existing.length) return existing
  const byId = seed.categories.reduce((map, item) => {
    map[item.id] = item
    return map
  }, {})
  const seen = new Set()
  return foods
    .map((item) => item.categoryId)
    .filter((id) => {
      if (!id || seen.has(id)) return false
      seen.add(id)
      return true
    })
    .map((id, index) => {
      const known = byId[id]
      return {
        id,
        name: known ? known.name : id,
        emoji: known ? known.emoji : '🥗',
        sort: known ? known.sort : (index + 1) * 10,
        enabled: true,
        isSystem: Boolean(known),
        updatedAt: '',
      }
    })
}

async function ensureMissingAgeRules() {
  await ensureCollection(COLLECTIONS.rules)
  const existing = await getAll(COLLECTIONS.rules)
  const have = new Set(existing.map((item) => item.ageId))
  const now = nowIso()
  const missing = DEFAULT_AGE_RULES.filter((item) => !have.has(item.ageId))
  for (const item of missing) {
    const id = `rule_${item.ageId.replace(/[^a-z0-9]/gi, '_')}`
    try {
      await addDoc(COLLECTIONS.rules, {
        _id: id,
        id,
        ageId: item.ageId,
        title: item.title,
        content: item.content,
        seasonings: normalizeSeasoningList(item.seasonings),
        portions: normalizePortions(item.portions),
        enabled: true,
        createdAt: now,
        updatedAt: now,
      })
    } catch (error) {
      console.error('[adminApi] ensure rule', item.ageId, error)
    }
  }

  const defaults = DEFAULT_AGE_RULES.reduce((map, item) => {
    map[item.ageId] = item
    return map
  }, {})
  for (const doc of existing) {
    const def = defaults[doc.ageId]
    if (!def) continue
    const patch = {}
    if (!normalizeSeasoningList(doc.seasonings).length) patch.seasonings = def.seasonings
    if (!hasPortions(doc.portions)) patch.portions = def.portions
    if (!Object.keys(patch).length) continue
    try {
      await db.collection(COLLECTIONS.rules).doc(doc._id || doc.id).update({
        data: { ...patch, updatedAt: now },
      })
    } catch (error) {
      console.error('[adminApi] heal rule', doc.ageId, error)
    }
  }
  return missing.length
}

async function ensureMissingKnowledge() {
  await ensureCollection(COLLECTIONS.knowledge)
  const existing = await getAll(COLLECTIONS.knowledge)
  const have = new Set(existing.map((item) => `${normalizeKind(item.kind)}::${item.title}`))
  const now = nowIso()
  let inserted = 0
  for (const item of contentSeed.knowledge || []) {
    const key = `${normalizeKind(item.kind)}::${item.title}`
    if (have.has(key)) continue
    const id = item.id || nextId('knowledge')
    try {
      await addDoc(COLLECTIONS.knowledge, {
        _id: id,
        id,
        kind: normalizeKind(item.kind),
        title: item.title,
        source: item.source || '',
        content: item.content || '',
        emoji: item.emoji || '',
        ageRange: item.ageRange || '',
        extra: item.extra || '',
        enabled: item.enabled !== false,
        createdAt: now,
        updatedAt: now,
      })
      have.add(key)
      inserted += 1
    } catch (error) {
      console.error('[adminApi] ensure knowledge', item.title, error)
    }
  }
  return inserted
}

async function ensureMissingRecipes() {
  await ensureCollection(COLLECTIONS.recipes)
  const existing = await getAll(COLLECTIONS.recipes)
  const have = new Set(existing.map((item) => `${item.ageRange || ''}::${item.name}`))
  const now = nowIso()
  let inserted = 0
  for (const item of contentSeed.recipes || []) {
    const key = `${item.ageRange || ''}::${item.name}`
    if (have.has(key)) continue
    const id = item.id || nextId('recipe')
    try {
      await addDoc(COLLECTIONS.recipes, {
        _id: id,
        id,
        name: item.name,
        mealType: item.mealType || '推荐套餐',
        ageRange: item.ageRange || '',
        content: item.content || '',
        enabled: item.enabled !== false,
        createdAt: now,
        updatedAt: now,
      })
      have.add(key)
      inserted += 1
    } catch (error) {
      console.error('[adminApi] ensure recipe', item.name, error)
    }
  }
  return inserted
}

async function handleCatalogContent() {
  await ensureMissingKnowledge()
  await ensureMissingRecipes()
  const [knowledge, recipes] = await Promise.all([
    getAll(COLLECTIONS.knowledge),
    getAll(COLLECTIONS.recipes),
  ])
  return ok({
    knowledge: knowledge.filter((item) => item.enabled !== false).map(toKnowledge),
    recipes: recipes.filter((item) => item.enabled !== false).map(toRecipe),
  })
}

async function handleCatalogList() {
  await ensureMissingSystemCategories()
  const [allCategories, allFoods] = await Promise.all([
    getAll(COLLECTIONS.categories),
    getAll(COLLECTIONS.foods),
  ])
  const foods = allFoods.filter((item) => item.enabled !== false)
  const categories = deriveCategoriesFromFoods(
    foods,
    allCategories.filter((item) => item.enabled !== false),
  )
  categories.sort((a, b) => (a.sort || 0) - (b.sort || 0))
  foods.sort((a, b) => (a.sort || 0) - (b.sort || 0) || String(a.name).localeCompare(String(b.name), 'zh-CN'))
  return ok({
    categories: categories.map(toCategory),
    foods: foods.map(toFood),
    stats: {
      categoryTotal: allCategories.length,
      foodTotal: allFoods.length,
    },
  })
}

async function handleSeedIfEmpty(operator) {
  const foodTotal = await safeCount(COLLECTIONS.foods)
  const inserted = { categories: 0, foods: 0, knowledge: 0, recipes: 0 }
  const now = nowIso()

  inserted.categories = await ensureMissingSystemCategories()
  await ensureMissingAgeRules()
  inserted.knowledge = await ensureMissingKnowledge()
  inserted.recipes = await ensureMissingRecipes()

  if (foodTotal === 0) {
    const docs = seed.foods.map((item) => ({
      _id: item.id,
      id: item.id,
      name: item.name,
      emoji: item.emoji,
      categoryId: item.categoryId,
      subCategory: item.subCategory,
      enabled: item.enabled !== false,
      sort: item.sort,
      createdAt: now,
      updatedAt: now,
    }))
    await addInBatches(COLLECTIONS.foods, docs)
    inserted.foods = docs.length
  }

  const skipped =
    inserted.categories === 0 &&
    inserted.foods === 0 &&
    inserted.knowledge === 0 &&
    inserted.recipes === 0
  const message = skipped
    ? '分类、食材、知识与食谱集合已有数据，未执行导入，避免覆盖现有记录'
    : `已初始化分类 ${inserted.categories} 条、食材 ${inserted.foods} 条、知识 ${inserted.knowledge} 条、食谱 ${inserted.recipes} 条（仅补缺失）`

  if (!skipped) {
    await writeLog(
      operator,
      '初始化目录',
      `分类 ${inserted.categories} / 食材 ${inserted.foods} / 知识 ${inserted.knowledge} / 食谱 ${inserted.recipes}`,
    )
  }

  return ok({ ...inserted, skipped, message })
}

async function handleListCategories() {
  await ensureMissingSystemCategories()
  let [categories, foods] = await Promise.all([getAll(COLLECTIONS.categories), getAll(COLLECTIONS.foods)])
  if (!categories.length) {
    const derived = deriveCategoriesFromFoods(foods, [])
    const now = nowIso()
    for (const item of derived) {
      try {
        await upsertCategoryDoc(item, now)
      } catch (error) {
        console.error('[adminApi] persist derived category', item.id, error)
      }
    }
    categories = await getAll(COLLECTIONS.categories)
    if (!categories.length) categories = derived
  }
  const counts = {}
  foods.forEach((item) => {
    const key = item.categoryId
    counts[key] = (counts[key] || 0) + 1
  })
  return ok(
    categories
      .map((item) => ({
        ...toCategory(item),
        foodCount: counts[item.id || item._id] || 0,
      }))
      .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, 'zh-CN')),
  )
}

async function handleCreateCategory(input, operator) {
  const id = requireText(input.id, '分类 ID', 32)
  if (!/^[a-z][a-z0-9_]*$/.test(id)) {
    throw new Error('分类 ID 仅允许小写字母、数字和下划线，且以字母开头')
  }
  const name = requireText(input.name, '分类名称', 20)
  const existing = await getAll(COLLECTIONS.categories)
  if (existing.some((item) => (item.id || item._id) === id)) throw new Error('分类 ID 已存在，且系统分类 ID 不可更改')
  if (existing.some((item) => item.name === name)) throw new Error('分类名称已存在')

  const now = nowIso()
  const data = {
    _id: id,
    id,
    name,
    emoji: String(input.emoji || '').trim() || '🥗',
    sort: Number(input.sort) || 80,
    enabled: input.enabled !== false,
    isSystem: SYSTEM_CATEGORY_IDS.has(id),
    createdAt: now,
    updatedAt: now,
  }
  await addDoc(COLLECTIONS.categories, data)
  await writeLog(operator, '新增分类', `${data.emoji} ${name}`)
  return ok(toCategory(data))
}

async function handleUpdateCategory(input, operator) {
  const id = requireText(input.id, '分类 ID')
  const current = await requireDoc(COLLECTIONS.categories, id, '分类')
  const name = requireText(input.name, '分类名称', 20)
  const existing = await getAll(COLLECTIONS.categories)
  if (existing.some((item) => item.name === name && (item.id || item._id) !== id)) {
    throw new Error('分类名称已存在')
  }
  const next = {
    name,
    emoji: String(input.emoji || '').trim() || current.emoji || '🥗',
    sort: Number(input.sort) || current.sort || 80,
    enabled: input.enabled !== false,
    isSystem: Boolean(current.isSystem) || SYSTEM_CATEGORY_IDS.has(id),
    updatedAt: nowIso(),
  }
  await db.collection(COLLECTIONS.categories).doc(id).update({ data: next })
  await writeLog(operator, '编辑分类', `${next.emoji} ${name}`)
  return ok(toCategory({ ...current, ...next, id }))
}

async function handleDeleteCategory(input, operator) {
  const id = requireText(input.id, '分类 ID')
  const current = await requireDoc(COLLECTIONS.categories, id, '分类')
  if (current.isSystem || SYSTEM_CATEGORY_IDS.has(id)) {
    throw new Error('系统预置分类不可删除，仅可停用')
  }
  const foodCount = await safeCount(COLLECTIONS.foods, { categoryId: id })
  if (foodCount > 0) throw new Error(`该分类下仍有 ${foodCount} 个食材，无法删除`)
  await db.collection(COLLECTIONS.categories).doc(id).remove()
  await writeLog(operator, '删除分类', current.name || id)
  return ok(null)
}

function matchFood(item, query) {
  const keyword = String((query && query.name) || '').trim()
  if (keyword && String(item.name || '').indexOf(keyword) < 0) return false
  if (query && query.categoryId && item.categoryId !== query.categoryId) return false
  if (query && query.enabled === true && item.enabled === false) return false
  if (query && query.enabled === false && item.enabled !== false) return false
  return true
}

async function handleListFoods(input) {
  const page = Math.max(1, Number(input.page) || 1)
  const pageSize = Math.min(500, Math.max(1, Number(input.pageSize) || 10))
  const foods = (await getAll(COLLECTIONS.foods))
    .filter((item) => matchFood(item, input))
    .sort((a, b) => (a.sort || 0) - (b.sort || 0) || String(a.name).localeCompare(String(b.name), 'zh-CN'))
  const start = (page - 1) * pageSize
  return ok({
    list: foods.slice(start, start + pageSize).map(toFood),
    total: foods.length,
    page,
    pageSize,
  })
}

async function handleGetFood(input) {
  const id = requireText(input.id, '食材 ID')
  const doc = await requireDoc(COLLECTIONS.foods, id, '食材')
  return ok(toFood(doc))
}

async function assertCategoryExists(categoryId) {
  const id = requireText(categoryId, '分类')
  await requireDoc(COLLECTIONS.categories, id, '所选分类')
  return id
}

async function assertFoodNameUnique(name, excludeId) {
  const foods = await getAll(COLLECTIONS.foods)
  if (foods.some((item) => item.name === name && (item.id || item._id) !== excludeId)) {
    throw new Error('食材名称已存在')
  }
}

async function handleCreateFood(input, operator) {
  const name = requireText(input.name, '食材名称', 20)
  const categoryId = await assertCategoryExists(input.categoryId)
  await assertFoodNameUnique(name)
  const now = nowIso()
  const id = nextId('food')
  const data = {
    _id: id,
    id,
    name,
    emoji: String(input.emoji || '').trim() || '🥗',
    categoryId,
    subCategory: requireText(input.subCategory, '子分类', 20),
    enabled: input.enabled !== false,
    sort: Number(input.sort) || 100,
    createdAt: now,
    updatedAt: now,
  }
  await addDoc(COLLECTIONS.foods, data)
  await writeLog(operator, '新增食材', `${data.emoji} ${name}`)
  return ok(toFood(data))
}

async function handleUpdateFood(input, operator) {
  const id = requireText(input.id, '食材 ID')
  const current = await requireDoc(COLLECTIONS.foods, id, '食材')
  const name = requireText(input.name, '食材名称', 20)
  const categoryId = await assertCategoryExists(input.categoryId)
  await assertFoodNameUnique(name, id)
  const next = {
    name,
    emoji: String(input.emoji || '').trim() || current.emoji || '🥗',
    categoryId,
    subCategory: requireText(input.subCategory, '子分类', 20),
    enabled: input.enabled !== false,
    sort: Number(input.sort) || current.sort || 100,
    updatedAt: nowIso(),
  }
  await db.collection(COLLECTIONS.foods).doc(id).update({ data: next })
  await writeLog(operator, '编辑食材', `${next.emoji} ${name}`)
  return ok(toFood({ ...current, ...next, id }))
}

async function handleSetFoodEnabled(input, operator) {
  const id = requireText(input.id, '食材 ID')
  const current = await requireDoc(COLLECTIONS.foods, id, '食材')
  const enabled = input.enabled !== false
  const next = { enabled, updatedAt: nowIso() }
  await db.collection(COLLECTIONS.foods).doc(id).update({ data: next })
  await writeLog(operator, enabled ? '启用食材' : '停用食材', current.name || id)
  return ok(toFood({ ...current, ...next, id }))
}

async function handleDeleteFood(input, operator) {
  const id = requireText(input.id, '食材 ID')
  const current = await requireDoc(COLLECTIONS.foods, id, '食材')
  await db.collection(COLLECTIONS.foods).doc(id).remove()
  await writeLog(operator, '删除食材', current.name || id)
  return ok(null)
}

async function handleListSimple(name, mapper) {
  const list = await getAll(name)
  list.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
  return ok(list.map(mapper))
}

async function handleCreateRecipe(input, operator) {
  const now = nowIso()
  const id = nextId('recipe')
  const data = {
    _id: id,
    id,
    name: requireText(input.name, '食谱名称', 40),
    mealType: requireText(input.mealType, '餐次', 20),
    ageRange: requireText(input.ageRange, '适用月龄', 20),
    content: String(input.content || '').trim(),
    enabled: input.enabled !== false,
    createdAt: now,
    updatedAt: now,
  }
  await addDoc(COLLECTIONS.recipes, data)
  await writeLog(operator, '新增食谱', data.name)
  return ok(toRecipe(data))
}

async function handleUpdateRecipe(input, operator) {
  const id = requireText(input.id, '食谱 ID')
  const current = await requireDoc(COLLECTIONS.recipes, id, '食谱')
  const next = {
    name: requireText(input.name, '食谱名称', 40),
    mealType: requireText(input.mealType, '餐次', 20),
    ageRange: requireText(input.ageRange, '适用月龄', 20),
    content: String(input.content || '').trim(),
    enabled: input.enabled !== false,
    updatedAt: nowIso(),
  }
  await db.collection(COLLECTIONS.recipes).doc(id).update({ data: next })
  await writeLog(operator, '编辑食谱', next.name)
  return ok(toRecipe({ ...current, ...next, id }))
}

async function handleDeleteRecipe(input, operator) {
  const id = requireText(input.id, '食谱 ID')
  const current = await requireDoc(COLLECTIONS.recipes, id, '食谱')
  await db.collection(COLLECTIONS.recipes).doc(id).remove()
  await writeLog(operator, '删除食谱', current.name || id)
  return ok(null)
}

async function handleCreateKnowledge(input, operator) {
    const now = nowIso()
    const id = nextId('knowledge')
    const data = {
    _id: id,
    id,
    ...knowledgeFields(input),
    createdAt: now,
    updatedAt: now,
  }
  await addDoc(COLLECTIONS.knowledge, data)
  await writeLog(operator, '新增知识', data.title)
  return ok(toKnowledge(data))
}

async function handleUpdateKnowledge(input, operator) {
  const id = requireText(input.id, '知识 ID')
  const current = await requireDoc(COLLECTIONS.knowledge, id, '知识条目')
  const next = {
    ...knowledgeFields(input),
    updatedAt: nowIso(),
  }
  await db.collection(COLLECTIONS.knowledge).doc(id).update({ data: next })
  await writeLog(operator, '编辑知识', next.title)
  return ok(toKnowledge({ ...current, ...next, id }))
}

async function handleDeleteKnowledge(input, operator) {
  const id = requireText(input.id, '知识 ID')
  const current = await requireDoc(COLLECTIONS.knowledge, id, '知识条目')
  await db.collection(COLLECTIONS.knowledge).doc(id).remove()
  await writeLog(operator, '删除知识', current.title || id)
  return ok(null)
}

async function handleCreateRule(input, operator) {
  const now = nowIso()
  const id = nextId('rule')
  const data = {
    _id: id,
    id,
    ageId: requireText(input.ageId, '月龄档', 20),
    title: requireText(input.title, '规则摘要', 80),
    content: String(input.content || '').trim(),
    seasonings: normalizeSeasoningList(input.seasonings),
    portions: normalizePortions(input.portions),
    enabled: input.enabled !== false,
    createdAt: now,
    updatedAt: now,
  }
  await addDoc(COLLECTIONS.rules, data)
  await writeLog(operator, '新增规则', data.title)
  return ok(toRule(data))
}

async function handleUpdateRule(input, operator) {
  const id = requireText(input.id, '规则 ID')
  const current = await requireDoc(COLLECTIONS.rules, id, '推荐规则')
  const next = {
    ageId: requireText(input.ageId, '月龄档', 20),
    title: requireText(input.title, '规则摘要', 80),
    content: String(input.content || '').trim(),
    seasonings: normalizeSeasoningList(input.seasonings),
    portions: normalizePortions(input.portions),
    enabled: input.enabled !== false,
    updatedAt: nowIso(),
  }
  await db.collection(COLLECTIONS.rules).doc(id).update({ data: next })
  await writeLog(operator, '编辑规则', next.title)
  return ok(toRule({ ...current, ...next, id }))
}

async function handleDeleteRule(input, operator) {
  const id = requireText(input.id, '规则 ID')
  const current = await requireDoc(COLLECTIONS.rules, id, '推荐规则')
  await db.collection(COLLECTIONS.rules).doc(id).remove()
  await writeLog(operator, '删除规则', current.title || id)
  return ok(null)
}

async function handleListLogs() {
  const list = await getAll(COLLECTIONS.logs)
  list.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
  return ok(list.slice(0, 200).map(toLog))
}

const AGE_LABELS = {
  '6-8': '6-8个月',
  '8-10': '8-10个月',
  '10-12': '10-12个月',
  '1-2': '1-2岁',
  '2-3': '2-3岁',
  '4-5': '4-5岁',
  '6-7': '6-7岁',
}

function countBy(list, keyFn) {
  const map = {}
  list.forEach((item) => {
    const key = keyFn(item)
    if (!key) return
    map[key] = (map[key] || 0) + 1
  })
  return map
}

async function handleDashboard() {
  const [categories, foods, recipes, knowledge, babies] = await Promise.all([
    getAll(COLLECTIONS.categories),
    getAll(COLLECTIONS.foods),
    getAll(COLLECTIONS.recipes),
    getAll(COLLECTIONS.knowledge),
    getAll(COLLECTIONS.babies),
  ])

  const categoryStats = categories
    .slice()
    .sort((a, b) => (a.sort || 0) - (b.sort || 0))
    .map((category) => {
      const id = category.id || category._id
      return {
        name: category.name,
        value: foods.filter((food) => food.categoryId === id).length,
      }
    })

  const recentUpdates = [
    ...foods.map((item) => ({
      id: item.id || item._id,
      title: `${item.emoji || ''} ${item.name}`.trim(),
      type: '食材',
      updatedAt: item.updatedAt || '',
    })),
    ...recipes.map((item) => ({
      id: item.id || item._id,
      title: item.name,
      type: '食谱',
      updatedAt: item.updatedAt || '',
    })),
    ...knowledge.map((item) => ({
      id: item.id || item._id,
      title: item.title,
      type: '喂养知识',
      updatedAt: item.updatedAt || '',
    })),
  ]
    .filter((item) => item.updatedAt)
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))

  const dayKeys = []
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    dayKeys.push(date.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' }))
  }
  function toDay(value) {
    if (!value) return ''
    try {
      return new Date(value).toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })
    } catch (error) {
      return String(value).slice(0, 10)
    }
  }

  const subCount = countBy(foods, (item) => String(item.subCategory || '').trim() || '未分组')
  const subCategoryStats = Object.keys(subCount)
    .map((name) => ({ name, value: subCount[name] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const knowledgeKindStats = Object.keys(KNOWLEDGE_KIND_META)
    .map((kind) => ({
      name: KNOWLEDGE_KIND_META[kind].label,
      value: knowledge.filter((item) => normalizeKind(item.kind) === kind).length,
    }))
    .filter((item) => item.value > 0)

  const recipeAgeStats = Object.keys(AGE_LABELS).map((ageId) => ({
    name: AGE_LABELS[ageId],
    value: recipes.filter((item) => String(item.ageRange || '').replace(/个月|月龄|岁/g, '').replace(/\s/g, '') === ageId).length,
  }))

  const realBabies = babies.map(toBabySummary).filter((item) => !item.isDefault)
  const userAgeStats = Object.keys(AGE_LABELS).map((ageId) => ({
    name: AGE_LABELS[ageId],
    value: realBabies.filter((item) => item.ageId === ageId).length,
  }))

  const foodTrend = {
    days: dayKeys.map((date) => ({
      date,
      label: date.slice(5).replace('-', '/'),
    })),
    series: categories
      .slice()
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
      .map((category) => {
        const id = category.id || category._id
        return {
          name: category.name,
          data: dayKeys.map(
            (date) =>
              foods.filter((food) => food.categoryId === id && toDay(food.updatedAt || food.createdAt) === date).length,
          ),
        }
      }),
  }

  return ok({
    foodCount: foods.length,
    foodEnabledCount: foods.filter((item) => item.enabled !== false).length,
    recipeCount: recipes.length,
    knowledgeCount: knowledge.length,
    categoryCount: categories.length,
    categoryStats,
    recentUpdates: recentUpdates.slice(0, 8),
    foodTrend,
    subCategoryStats,
    knowledgeKindStats,
    recipeAgeStats,
    userAgeStats,
    userCount: realBabies.length,
  })
}

async function handleMe(operator, payload) {
  return ok({
    id: payload.sub,
    username: payload.username,
    displayName: '系统管理员',
    role: payload.role || 'super',
  })
}

async function dispatch(input) {
  const action = String((input && input.action) || '')
  if (!action) return fail('缺少 action')

  if (action === 'login') return handleLogin(input)
  if (action === 'catalogList') return handleCatalogList()
  if (action === 'catalogRules') {
    await ensureMissingAgeRules()
    const rules = (await getAll(COLLECTIONS.rules))
      .filter((item) => item.enabled !== false)
      .map(toRule)
      .sort((a, b) => String(a.ageId).localeCompare(String(b.ageId), 'en'))
    return ok(rules)
  }
  if (action === 'catalogContent') return handleCatalogContent()

  if (!PUBLIC_ACTIONS.has(action)) {
    const config = getAuthConfig()
    if (config.missing) {
      return fail(authConfigError(config))
    }
    const payload = verifyToken(input.token, config.secret)
    if (!payload) return fail('未登录或登录已过期')
    const operator = payload.username || 'admin'

    switch (action) {
      case 'me':
        return handleMe(operator, payload)
      case 'seedIfEmpty':
        return handleSeedIfEmpty(operator)
      case 'dashboard':
        return handleDashboard()
      case 'listCategories':
        return handleListCategories()
      case 'createCategory':
        return handleCreateCategory(input, operator)
      case 'updateCategory':
        return handleUpdateCategory(input, operator)
      case 'deleteCategory':
        return handleDeleteCategory(input, operator)
      case 'listFoods':
        return handleListFoods(input)
      case 'getFood':
        return handleGetFood(input)
      case 'createFood':
        return handleCreateFood(input, operator)
      case 'updateFood':
        return handleUpdateFood(input, operator)
      case 'setFoodEnabled':
        return handleSetFoodEnabled(input, operator)
      case 'deleteFood':
        return handleDeleteFood(input, operator)
      case 'listRecipes':
        await ensureMissingRecipes()
        return handleListSimple(COLLECTIONS.recipes, toRecipe)
      case 'createRecipe':
        return handleCreateRecipe(input, operator)
      case 'updateRecipe':
        return handleUpdateRecipe(input, operator)
      case 'deleteRecipe':
        return handleDeleteRecipe(input, operator)
      case 'listKnowledge':
        await ensureMissingKnowledge()
        return handleListSimple(COLLECTIONS.knowledge, toKnowledge)
      case 'createKnowledge':
        return handleCreateKnowledge(input, operator)
      case 'updateKnowledge':
        return handleUpdateKnowledge(input, operator)
      case 'deleteKnowledge':
        return handleDeleteKnowledge(input, operator)
      case 'listRules':
        await ensureMissingAgeRules()
        return handleListSimple(COLLECTIONS.rules, toRule)
      case 'createRule':
        return handleCreateRule(input, operator)
      case 'updateRule':
        return handleUpdateRule(input, operator)
      case 'deleteRule':
        return handleDeleteRule(input, operator)
      case 'listLogs':
        return handleListLogs()
      case 'listBabies':
        return handleListBabies(input)
      case 'getBaby':
        return handleGetBaby(input)
      default:
        return fail(`不支持的 action：${action}`)
    }
  }

  return fail(`不支持的 action：${action}`)
}

exports.main = async (event) => {
  const http = isHttpEvent(event)
  if (http && String(event.httpMethod || '').toUpperCase() === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' }
  }

  let input
  try {
    input = parseInput(event)
  } catch (error) {
    const result = fail('请求参数不是合法 JSON')
    return http ? { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(result) } : result
  }

  try {
    const result = await dispatch(input)
    return http ? { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(result) } : result
  } catch (error) {
    const result = fail((error && error.message) || '云函数执行失败')
    return http ? { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(result) } : result
  }
}
