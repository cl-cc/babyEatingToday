const TAG_POOL = [
  { pattern: /牛肉|羊肉|猪肉|鸡肉|鸭肉|鱼|虾|蟹|蛋|豆腐|鳕鱼|三文鱼|带鱼/, emoji: '🥩', label: '高蛋白' },
  { pattern: /西兰花|菠菜|青菜|芹菜|燕麦|玉米|红薯|苹果|香蕉|猕猴桃|蓝莓/, emoji: '🥦', label: '高纤维' },
  { pattern: /牛奶|酸奶|奶酪|豆腐|虾皮|芝麻|奶酪|酸奶/, emoji: '🦴', label: '高钙' },
  { pattern: /牛肉|猪肝|菠菜|红枣|蛋黄|黑木耳/, emoji: '🩸', label: '富铁' },
]

const AMOUNT_BY_AGE = {
  '6-8': { meat: '10g', veg: '15g', fruit: '15g', grain: '20g', default: '15g' },
  '8-10': { meat: '15g', veg: '20g', fruit: '20g', grain: '25g', default: '20g' },
  '10-12': { meat: '20g', veg: '25g', fruit: '25g', grain: '30g', default: '25g' },
  '1-2': { meat: '25g', veg: '30g', fruit: '30g', grain: '35g', default: '30g' },
  '2+': { meat: '30g', veg: '35g', fruit: '35g', grain: '40g', default: '35g' },
}

const RING_COLORS = {
  蛋白质: '#FF8FAB',
  维C: '#5ECFB8',
  铁: '#FFB088',
  钙: '#9BB8FF',
  纤维: '#B8E986',
}

function getFoodCategory(name) {
  const n = name || ''
  if (/牛肉|羊肉|猪肉|鸡肉|鸭肉|鱼|虾|蟹|蛋|猪肝/.test(n)) return 'meat'
  if (/米|面|粥|馒头|面包|燕麦|玉米|红薯/.test(n)) return 'grain'
  if (/苹果|香蕉|梨|葡萄|草莓|蓝莓|猕猴桃|芒果|橙/.test(n)) return 'fruit'
  if (/菜|瓜|萝卜|土豆|番茄|西兰|菠菜|菌|菇/.test(n)) return 'veg'
  return 'default'
}

function guessAmount(name, ageId) {
  const cfg = AMOUNT_BY_AGE[ageId] || AMOUNT_BY_AGE['8-10']
  const cat = getFoodCategory(name)
  return cfg[cat] || cfg.default
}

function guessTags(name) {
  const tags = []
  const seen = new Set()
  TAG_POOL.forEach((rule) => {
    if (rule.pattern.test(name) && !seen.has(rule.label)) {
      seen.add(rule.label)
      tags.push({ emoji: rule.emoji, label: rule.label })
    }
  })
  return tags.slice(0, 2)
}

function normalizeTagItem(tag) {
  if (!tag) return null
  if (typeof tag === 'string') {
    const found = TAG_POOL.find((t) => tag.includes(t.label))
    return found ? { emoji: found.emoji, label: found.label } : { emoji: '🥗', label: tag }
  }
  return {
    emoji: tag.emoji || '🥗',
    label: tag.label || tag.name || '',
  }
}

function enrichFoodTags(food) {
  const fromAi = (food.tags || []).map(normalizeTagItem).filter((t) => t && t.label)
  return fromAi.length ? fromAi.slice(0, 2) : guessTags(food.name)
}

function aggregateMealTags(foods) {
  const seen = new Set()
  const tags = []
  ;(foods || []).forEach((food) => {
    ;(food.tags || []).forEach((tag) => {
      if (!seen.has(tag.label)) {
        seen.add(tag.label)
        tags.push(tag)
      }
    })
  })
  return tags.slice(0, 4)
}

function buildMealRings(foods) {
  let protein = 62
  let vc = 55
  let iron = 58

  ;(foods || []).forEach((food) => {
    const n = food.name || ''
    if (/肉|蛋|鱼|虾|蟹|豆腐|鸡|鸭|猪|牛|羊/.test(n)) protein += 9
    if (/西兰|菠菜|番茄|猕猴桃|橙|草莓|蓝莓|彩椒|芒果/.test(n)) vc += 11
    if (/牛肉|猪肝|菠菜|红枣|蛋黄|黑木耳|羊肉/.test(n)) iron += 12
    if (/牛奶|奶酪|豆腐|虾皮/.test(n)) iron += 4
  })

  return [
    { label: '蛋白质', percent: Math.min(98, protein) },
    { label: '维C', percent: Math.min(98, vc) },
    { label: '铁', percent: Math.min(98, iron) },
  ]
}

function withRingStyle(rings) {
  return (rings || []).map((ring) => {
    const percent = Math.max(0, Math.min(100, Number(ring.percent) || 0))
    const color = ring.color || RING_COLORS[ring.label] || '#FF8FAB'
    return Object.assign({}, ring, {
      percent,
      color,
      ringStyle: `background: conic-gradient(${color} 0% ${percent}%, #F0EBEE ${percent}% 100%);`,
    })
  })
}

function enrichTodayFood(food, ageId) {
  const base = {
    emoji: food.emoji || '🥗',
    name: food.name || '',
    amount: food.amount || guessAmount(food.name, ageId),
  }
  const tags = enrichFoodTags(food)
  return Object.assign({}, base, { tags })
}

function enrichTodayFoods(foods, ageId) {
  return (foods || []).map((f) => enrichTodayFood(f, ageId))
}

function buildTodayNutrition(foods, data) {
  const enriched = enrichTodayFoods(foods, data.ageId)
  const rings = withRingStyle(
    data.nutritionRings && data.nutritionRings.length
      ? data.nutritionRings
      : buildMealRings(enriched)
  )
  return {
    foods: enriched,
    mealTags: aggregateMealTags(enriched),
    nutritionRings: rings,
  }
}

const SUGGESTION_POOL = [
  { leadText: '今天推荐', actionText: '尝试', emoji: '🫑', food: '青椒', ages: ['10-12', '1-2', '2+'] },
  { leadText: '今天试试', actionText: '', emoji: '🐟', food: '三文鱼', ages: ['8-10', '10-12', '1-2', '2+'] },
  { leadText: '今天推荐', actionText: '尝试', emoji: '🥦', food: '西兰花', ages: ['6-8', '8-10', '10-12', '1-2', '2+'] },
  { leadText: '今天试试', actionText: '', emoji: '🍠', food: '红薯', ages: ['6-8', '8-10', '10-12', '1-2', '2+'] },
  { leadText: '今天推荐', actionText: '尝试', emoji: '🥩', food: '牛肉', ages: ['8-10', '10-12', '1-2', '2+'] },
  { leadText: '今天试试', actionText: '', emoji: '🥑', food: '牛油果', ages: ['6-8', '8-10', '10-12', '1-2', '2+'] },
  { leadText: '今天推荐', actionText: '尝试', emoji: '🎃', food: '南瓜', ages: ['6-8', '8-10', '10-12', '1-2', '2+'] },
  { leadText: '今天试试', actionText: '', emoji: '🦐', food: '虾仁', ages: ['10-12', '1-2', '2+'] },
]

function formatSuggestionLine({ leadText, actionText, emoji, food }) {
  const prefix = actionText ? `${leadText}${actionText}` : leadText
  return `${prefix} ${emoji} ${food}`
}

function normalizeTodaySuggestion(data) {
  const leadText = String(data.leadText || '').trim()
  const food = String(data.food || data.name || '').trim()
  const emoji = data.emoji || '🥗'
  const isTryStyle = leadText === '今天试试' || data.style === 'try'
  const normalized = {
    leadText: isTryStyle ? '今天试试' : leadText || '今天推荐',
    actionText: isTryStyle ? '' : String(data.actionText || '尝试').trim(),
    emoji,
    food: food || '新食材',
  }
  normalized.line = formatSuggestionLine(normalized)
  return normalized
}

function buildLocalSuggestion(ageId, allergies) {
  const allergyNames = (allergies || []).map((a) => a.name)
  const pool = SUGGESTION_POOL.filter(
    (item) =>
      item.ages.includes(ageId) &&
      !allergyNames.some((a) => item.food.includes(a) || a.includes(item.food))
  )
  const list = pool.length ? pool : SUGGESTION_POOL.filter((item) => item.ages.includes(ageId))
  const pick = list[Math.floor(Math.random() * (list.length || 1))] || SUGGESTION_POOL[0]
  return normalizeTodaySuggestion(pick)
}

module.exports = {
  enrichTodayFood,
  enrichTodayFoods,
  aggregateMealTags,
  buildMealRings,
  withRingStyle,
  buildTodayNutrition,
  normalizeTodaySuggestion,
  buildLocalSuggestion,
  guessAmount,
  guessTags,
}
