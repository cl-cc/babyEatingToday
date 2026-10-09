const AGE_SEASONING_HINTS = {
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

const {
  enrichTodayFoods,
  aggregateMealTags,
  buildMealRings,
  withRingStyle,
} = require('./foodNutrition')

function estimateCalories(name) {
  const n = name || ''
  if (/牛肉|羊肉|猪肉/.test(n)) return 95
  if (/鸡|鸭/.test(n)) return 85
  if (/鱼|虾|蟹|鳕鱼|三文鱼|鲈鱼/.test(n)) return 75
  if (/蛋|蛋黄/.test(n)) return 70
  if (/米|饭|粥|糊|面|馄饨|意面/.test(n)) return 110
  if (/土豆|红薯|南瓜|玉米/.test(n)) return 65
  if (/西兰花|青菜|菠菜|胡萝卜|番茄|蔬菜/.test(n)) return 35
  if (/苹果|香蕉|猕猴桃|芒果|水果/.test(n)) return 50
  if (/牛奶|酸奶|奶酪/.test(n)) return 80
  if (/豆腐/.test(n)) return 55
  if (/面包/.test(n)) return 90
  return 60
}

function enrichFoods(foods) {
  return (foods || []).map((f) => ({
    ...f,
    calories: Number(f.calories) || estimateCalories(f.name),
  }))
}

function calcTotalCalories(foods) {
  return enrichFoods(foods).reduce((sum, f) => sum + f.calories, 0)
}

/** 直接使用 AI 返回的调料列表，仅做格式清洗 */
function normalizeSeasonings(seasonings) {
  if (!Array.isArray(seasonings)) return []
  return seasonings
    .filter((s) => s && (s.name || s.label))
    .map((s) => ({
      name: String(s.name || s.label).trim(),
      amount: String(s.amount || s.dose || s.usage || '').trim() || '按年龄段少量使用',
    }))
}

function normalizeStringList(list) {
  if (!Array.isArray(list)) return []
  return list.map((item) => String(item).trim()).filter(Boolean)
}

function estimateCookMinutes(foods, seasonings) {
  const list = foods || []
  let minutes = 8

  list.forEach((food) => {
    const name = String(food.name || '')
    if (/蒸蛋|蛋羹|炖/.test(name)) minutes += 6
    else if (/牛肉|羊肉|排骨|鸡腿/.test(name)) minutes += 8
    else if (/鱼|虾|鸡蛋|豆腐/.test(name)) minutes += 4
    else if (/粥|面|馄饨|意面|米饭/.test(name)) minutes += 5
    else minutes += 3
  })

  minutes += Math.min(4, (seasonings || []).length)
  return Math.max(10, Math.min(35, Math.round(minutes)))
}

function estimateIngredientPrice(foods, seasonings) {
  const priceMap = [
    [/三文鱼|鳕鱼|虾|牛肉/, 9],
    [/鸡肉|猪肉|羊肉|鱼|排骨/, 7],
    [/鸡蛋|牛奶|酸奶|奶酪/, 4],
    [/豆腐|豆类/, 3],
    [/西兰花|菠菜|芦笋|菌|菇/, 3],
    [/苹果|香蕉|猕猴桃|蓝莓|草莓|芒果/, 4],
    [/米|面|粥|燕麦|土豆|红薯|南瓜/, 2],
  ]

  let total = 0
  ;(foods || []).forEach((food) => {
    const name = String(food.name || '')
    let matched = 2.5
    priceMap.some(([reg, value]) => {
      if (reg.test(name)) {
        matched = value
        return true
      }
      return false
    })
    total += matched
  })

  total += Math.min(3, (seasonings || []).length * 0.6)
  return Math.max(6, Math.round(total))
}

function buildTodayMethods(foods, ageId) {
  const names = (foods || []).map((item) => String(item.name || '').trim()).filter(Boolean)
  const joined = names.join('、')
  const isSmallAge = ageId === '6-8' || ageId === '8-10'
  const baseTexture = isSmallAge ? '压成细腻泥状或小颗粒' : '切碎做成软烂小块'

  const protein = names.find((name) => /牛|猪|鸡|鱼|虾|蛋|豆腐/.test(name)) || names[0] || '主食材'
  const vegs = names.filter((name) => /菜|萝卜|西兰花|南瓜|土豆|菠菜|番茄|玉米/.test(name))
  const vegText = vegs.length ? vegs.join('、') : '配菜'

  return [
    `${protein}${isSmallAge ? '蒸熟后剁碎' : '焯熟后切碎'}，${vegText}处理干净后一并备好。`,
    `${joined}加入少量清水${isSmallAge ? '蒸熟或炖软' : '翻炒后加水焖软'}，全程少油少盐。`,
    `出锅前加入调料，整体${baseTexture}，放温后再给宝宝食用。`,
  ]
}

function normalizeTodayRecommend(data, ageId) {
  const age = ageId || data.ageId || '8-10'
  const foods = enrichTodayFoods(data.foods || [], age)
  const seasonings = normalizeSeasonings(data.seasonings)
  const nutritionRings = withRingStyle(
    data.nutritionRings && data.nutritionRings.length
      ? data.nutritionRings
      : buildMealRings(foods)
  )
  return {
    foods,
    seasonings,
    methods: normalizeStringList(data.methods).length
      ? normalizeStringList(data.methods)
      : buildTodayMethods(foods, age),
    mealTags: aggregateMealTags(foods),
    nutritionRings,
    tip: data.tip || '',
    cookTimeText:
      String(data.cookTimeText || data.cookTime || '').trim() ||
      `约${estimateCookMinutes(foods, seasonings)}分钟`,
    priceText:
      String(data.priceText || data.estimatedPrice || '').trim() ||
      `约${estimateIngredientPrice(foods, seasonings)}元`,
  }
}

function normalizeMeal(meal) {
  const ageId = meal.ageId || '8-10'
  const foods = enrichTodayFoods(meal.foods || meal, ageId)
  return {
    foods,
    seasonings: normalizeSeasonings(meal.seasonings),
    mealTags: normalizePairings(meal.mealTags || []).map((item) => ({
      emoji: item.emoji,
      label: item.name,
    })).filter((item) => item.label),
  }
}

function normalizeRandomMenu(data) {
  const keys = ['breakfast', 'lunch', 'dinner', 'snack']
  const result = {}
  keys.forEach((key) => {
    const raw = data[key]
    if (!raw) {
      result[key] = { foods: [], seasonings: [], mealTags: [] }
      return
    }
    if (Array.isArray(raw)) {
      result[key] = normalizeMeal({ foods: raw, ageId: data.ageId })
    } else {
      result[key] = normalizeMeal(Object.assign({ ageId: data.ageId }, raw))
    }
  })
  return result
}

function normalizeCombineResult(data) {
  const dishes = [
    { label: '主菜', name: data.main || '', calories: data.mainCalories },
    { label: '配菜', name: data.side || '', calories: data.sideCalories },
    { label: '水果', name: data.fruit || '', calories: data.fruitCalories },
  ].map((d) => ({
    ...d,
    calories: Number(d.calories) || estimateCalories(String(d.name).replace(/[^\u4e00-\u9fa5a-zA-Z]/g, '')),
  }))

  const totalCalories =
    Number(data.totalCalories) || dishes.reduce((s, d) => s + d.calories, 0)

  return {
    dishes,
    seasonings: normalizeSeasonings(data.seasonings),
    methods: normalizeStringList(data.methods),
    totalCalories,
    reasons: data.reasons || [],
  }
}

function normalizeFridgeResult(data) {
  const meals = [
    { label: '午餐', name: data.lunch || '', calories: data.lunchCalories, seasonings: data.lunchSeasonings, methods: data.lunchMethods },
    { label: '晚餐', name: data.dinner || '', calories: data.dinnerCalories, seasonings: data.dinnerSeasonings, methods: data.dinnerMethods },
    { label: '明早', name: data.tomorrowBreakfast || '', calories: data.breakfastCalories, seasonings: data.breakfastSeasonings, methods: data.breakfastMethods },
  ].map((m) => ({
    label: m.label,
    name: m.name,
    calories: Number(m.calories) || estimateCalories(String(m.name).replace(/[^\u4e00-\u9fa5a-zA-Z]/g, '')),
    seasonings: normalizeSeasonings(m.seasonings),
    methods: normalizeStringList(m.methods),
  }))

  return {
    meals,
    totalCalories: meals.reduce((s, m) => s + m.calories, 0),
    tips: data.tips || '',
  }
}

function normalizePairings(pairings) {
  if (!Array.isArray(pairings)) return []
  return pairings
    .filter(Boolean)
    .map((item) => {
      if (typeof item === 'string') {
        return { name: item.trim(), emoji: '🥗' }
      }
      return {
        name: String(item.name || item.label || '').trim(),
        emoji: item.emoji || '🥗',
      }
    })
    .filter((item) => item.name)
}

function getAgeLabelForAdvice(ageId) {
  const map = {
    '6-8': '6-8个月',
    '8-10': '8-10个月',
    '10-12': '10-12个月',
    '1-2': '1-2岁',
    '2-3': '2-3岁',
    '4-5': '4-5岁',
    '6-7': '6-7岁',
  }
  return map[ageId] || '该月龄'
}

function buildAuthorityAdvice(foodName, ageId, can) {
  const name = String(foodName || '').trim()
  const age = getAgeLabelForAdvice(ageId)

  if (/蜂蜜/.test(name)) {
    return {
      whoAdvice: 'WHO 建议：12 个月以前不要给婴儿喂食蜂蜜，避免肉毒杆菌孢子带来的风险。',
      aapAdvice: 'AAP 建议：1 岁前避免蜂蜜及添加糖食品，此阶段以母乳或配方奶为主。',
    }
  }
  if (/牛奶|鲜奶/.test(name)) {
    return {
      whoAdvice: 'WHO 建议：12 个月前以母乳或配方奶为主，不建议用鲜奶替代奶类主食。',
      aapAdvice: 'AAP 建议：满 1 岁后可引入牛奶，此前可在辅食中逐步尝试奶制品如酸奶。',
    }
  }
  if (/虾|蟹|海鲜|贝|鱼/.test(name)) {
    if (can === false) {
      return {
        whoAdvice: `WHO 建议：${age}辅食应安全引入，高敏海鲜类宜在医生指导下延后添加。`,
        aapAdvice: 'AAP 建议：常见过敏原如鱼虾需单独、少量尝试，并观察皮疹、呕吐等反应。',
      }
    }
    return {
      whoAdvice: `WHO 建议：${age}可逐步引入动物性食物，鱼虾需充分煮熟、质地细腻。`,
      aapAdvice: 'AAP 建议：首次添加鱼虾应少量、单独进行，出现过敏症状需立即停止并就医。',
    }
  }
  if (/鸡蛋|蛋/.test(name)) {
    return {
      whoAdvice: `WHO 建议：${age}可将蛋类作为优质蛋白来源，从蛋黄或全蛋泥状开始引入。`,
      aapAdvice: 'AAP 建议：鸡蛋是常见过敏原，首次添加需观察；确保完全煮熟，避免生蛋或溏心。',
    }
  }
  if (/坚果|花生|核桃|杏仁/.test(name)) {
    return {
      whoAdvice: `WHO 建议：${age}坚果类应磨粉或酱状添加，严禁整颗喂食以防窒息。`,
      aapAdvice: 'AAP 建议：坚果是高敏食物且窒息风险高，仅提供细腻酱状或粉末，并密切看护进食。',
    }
  }
  if (/盐|酱油|调味/.test(name)) {
    return {
      whoAdvice: 'WHO 建议：12 个月前辅食不应额外加盐，避免养成重口味并保护肾脏。',
      aapAdvice: 'AAP 建议：1 岁前避免额外钠盐；之后也应少盐少糖，优先食材本味。',
    }
  }

  if (can === false) {
    return {
      whoAdvice: `WHO 建议：${age}辅食应安全、足量、多样，当前月龄暂不建议引入该食材。`,
      aapAdvice: `AAP 建议：遵循分龄引入原则，不宜食用的食材应延后至推荐月龄再尝试。`,
    }
  }
  if (can === 'caution') {
    return {
      whoAdvice: `WHO 建议：${age}添加新食材应一种一种进行，从少量泥状开始，连续观察 3-5 天。`,
      aapAdvice: 'AAP 建议：谨慎尝试的食材宜在白天少量添加，留意皮疹、腹泻、呕吐等过敏信号。',
    }
  }
  return {
    whoAdvice: `WHO 建议：${age}饮食应多样均衡、少盐少糖，优先天然食材与家庭自制辅食。`,
    aapAdvice: `AAP 建议：${age}可适量引入该食材，注意质地适合吞咽，避免整颗硬粒以防窒息。`,
  }
}

function normalizeCanEatResult(data, query, ageId) {
  if (!data || data.found === false) {
    return {
      found: false,
      query: query || (data && data.name) || '',
      message:
        (data && data.message) ||
        '暂未收录该食材，建议首次少量尝试并观察过敏反应',
    }
  }

  const can = data.can
  const normalizedCan =
    can === true || can === false || can === 'caution' ? can : 'caution'

  const methods = normalizeStringList(data.methods || data.cooking || data.recommend)
  const name = data.name || query || ''
  const authority = buildAuthorityAdvice(name, ageId, normalizedCan)

  return {
    found: true,
    emoji: data.emoji || '🥗',
    name,
    can: normalizedCan,
    note: data.note || '',
    whoAdvice: (data.whoAdvice || '').trim() || authority.whoAdvice,
    aapAdvice: (data.aapAdvice || '').trim() || authority.aapAdvice,
    pairings: normalizePairings(data.pairings || data.combineWith),
    seasonings: normalizeSeasonings(data.seasonings),
    methods,
    avoid: normalizeStringList(data.avoid),
  }
}

module.exports = {
  AGE_SEASONING_HINTS,
  estimateCalories,
  enrichFoods,
  normalizeSeasonings,
  normalizeTodayRecommend,
  normalizeRandomMenu,
  normalizeCombineResult,
  normalizeFridgeResult,
  normalizeCanEatResult,
}
