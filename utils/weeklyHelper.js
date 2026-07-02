const { buildNutritionAnalysis } = require('./weeklyNutrition')

const SHOP_CATEGORY_DEFS = [
  { key: '肉类', aliases: ['肉类', '肉', '肉禽', 'meat'], emoji: '🥩' },
  { key: '蔬菜', aliases: ['蔬菜', '菜类', '青菜', 'vegetable'], emoji: '🥬' },
  { key: '主食', aliases: ['主食', '谷物', 'staple'], emoji: '🍚' },
  { key: '蛋奶豆', aliases: ['蛋奶', '蛋奶豆', '豆制品', 'dairy'], emoji: '🥚' },
  { key: '水果', aliases: ['水果', 'fruit'], emoji: '🍎' },
  { key: '调料', aliases: ['调料', '调料类', '调味', 'seasoning'], emoji: '🧂' },
  { key: '其他', aliases: ['其他', '其它', 'other'], emoji: '📦' },
]

const MEAL_DEFS = [
  { key: 'breakfast', icon: '🌅', label: '早餐' },
  { key: 'lunch', icon: '☀️', label: '午餐' },
  { key: 'dinner', icon: '🌙', label: '晚餐' },
]

function parseMealString(text) {
  const raw = String(text || '').trim()
  if (!raw) return []

  const dishes = []
  const regex = /([^,，]+?)\s*[（(]([^）)]*)[）)]/g
  let match

  while ((match = regex.exec(raw)) !== null) {
    dishes.push({
      name: match[1].trim(),
      details: match[2]
        .split(/[,，、]/)
        .map((s) => s.trim())
        .filter(Boolean),
    })
  }

  if (dishes.length) return dishes

  raw.split(/[,，]/).forEach((part) => {
    const name = part.trim()
    if (name) dishes.push({ name, details: [] })
  })

  return dishes
}

function normalizeDish(dish) {
  if (!dish) return null
  if (typeof dish === 'string') {
    const parsed = parseMealString(dish)
    return parsed[0] || { name: dish.trim(), details: [] }
  }

  const details = dish.details || dish.items || dish.ingredients || []
  return {
    name: String(dish.name || '').trim(),
    details: Array.isArray(details)
      ? details.map((item) => String(item).trim()).filter(Boolean)
      : [],
  }
}

function normalizeMealDishes(meal) {
  if (Array.isArray(meal)) {
    return meal.map(normalizeDish).filter((dish) => dish && dish.name)
  }
  if (typeof meal === 'string') {
    return parseMealString(meal)
  }
  return []
}

function buildDayMeals(day) {
  return MEAL_DEFS.map((def) => ({
    key: def.key,
    icon: def.icon,
    label: def.label,
    dishes: normalizeMealDishes(day[def.key]),
  }))
}

function normalizeDayMeals(day) {
  if (day.meals && day.meals.length) {
    return day.meals.map((meal) => ({
      key: meal.key,
      icon: meal.icon || '🍽️',
      label: meal.label || '',
      dishes: normalizeMealDishes(meal.dishes),
    }))
  }
  return buildDayMeals(day)
}

function calcDishTreeHeight(dishes) {
  if (!dishes || !dishes.length) return 0
  let height = 0
  const DISH_CARD_PAD = 14
  const DISH_CARD_GAP = 12
  const DISH_DETAIL_LINE_H = 28
  dishes.forEach((dish) => {
    const detailCount = dish.details ? dish.details.length : 0
    const innerH = detailCount
      ? Math.max(30, detailCount * DISH_DETAIL_LINE_H + 8)
      : 30
    height += innerH + DISH_CARD_PAD * 2 + DISH_CARD_GAP
  })
  return height
}

function calcDayMealsHeight(meals) {
  if (!meals || !meals.length) return 0
  let height = 0
  meals.forEach((meal) => {
    height += 38 + calcDishTreeHeight(meal.dishes) + 14
  })
  return height
}

function splitShoppingText(entry) {
  return String(entry)
    .split(/[、,，;；\n|/]/)
    .map((part) =>
      part
        .trim()
        .replace(/^[\d]+[\.、\)]\s*/, '')
        .replace(/^[·•\-]\s*/, '')
        .trim()
    )
    .filter(Boolean)
}

function resolveCategoryKey(rawKey) {
  const key = String(rawKey || '').trim()
  if (!key) return '其他'
  const found = SHOP_CATEGORY_DEFS.find((def) =>
    def.aliases.some((alias) => key === alias || key.includes(alias))
  )
  return found ? found.key : '其他'
}

function classifyByKeyword(name) {
  const text = String(name || '')
  if (/牛肉|鸡肉|猪肉|羊肉|鱼|虾|蟹|鳕鱼|三文鱼|肉|排骨|鸡翅|猪肝/.test(text)) {
    return '肉类'
  }
  if (/西兰花|青菜|菠菜|胡萝卜|番茄|土豆|南瓜|玉米|蔬菜|白菜|黄瓜|芹菜|香菇|蘑菇/.test(text)) {
    return '蔬菜'
  }
  if (/米|饭|面|粥|馒头|面包|馄饨|主食|燕麦|杂粮|面条|意面/.test(text)) {
    return '主食'
  }
  if (/蛋|奶|奶酪|酸奶|豆腐|豆|豆浆/.test(text)) {
    return '蛋奶豆'
  }
  if (/苹果|香蕉|猕猴桃|芒果|蓝莓|水果|梨|葡萄|草莓/.test(text)) {
    return '水果'
  }
  if (/盐|糖|酱油|油|姜|葱|蒜|调料|调味|蚝油|香油|醋/.test(text)) {
    return '调料'
  }
  return '其他'
}

function normalizeShoppingCategories(shoppingList) {
  const buckets = {}
  SHOP_CATEGORY_DEFS.forEach((def) => {
    buckets[def.key] = []
  })
  const seen = {}

  const assignItem = (name, categoryKey) => {
    const key = categoryKey || classifyByKeyword(name)
    const bucketKey = buckets[key] ? key : '其他'
    const uniq = `${bucketKey}::${name}`
    if (seen[uniq]) return
    seen[uniq] = true
    buckets[bucketKey].push(name)
  }

  if (Array.isArray(shoppingList)) {
    shoppingList.forEach((entry) => {
      splitShoppingText(entry).forEach((name) => assignItem(name))
    })
  } else if (shoppingList && typeof shoppingList === 'object') {
    Object.keys(shoppingList).forEach((rawKey) => {
      const categoryKey = resolveCategoryKey(rawKey)
      const items = shoppingList[rawKey]
      if (Array.isArray(items)) {
        items.forEach((entry) => {
          splitShoppingText(entry).forEach((name) => assignItem(name, categoryKey))
        })
      } else if (items) {
        splitShoppingText(items).forEach((name) => assignItem(name, categoryKey))
      }
    })
  }

  const shoppingCategories = SHOP_CATEGORY_DEFS.map((def) => ({
    key: def.key,
    label: def.key,
    emoji: def.emoji,
    items: buckets[def.key] || [],
  })).filter((cat) => cat.items.length > 0)

  const shoppingTotal = shoppingCategories.reduce((sum, cat) => sum + cat.items.length, 0)

  return {
    shoppingCategories,
    shoppingTotal,
  }
}

function buildWeekLayout(days, nutrition) {
  const list = days || []
  const pairs = []
  for (let i = 0; i < 6; i += 2) {
    pairs.push({
      key: `pair-${i}`,
      left: list[i] || null,
      right: list[i + 1] || null,
    })
  }
  return {
    pairs,
    lastRow: {
      day: list[6] || null,
      nutrition: nutrition || [],
    },
  }
}

function normalizeWeeklyMenu(menu) {
  if (!menu) return menu
  const shopping = normalizeShoppingCategories(menu.shoppingList)
  const nutrition = menu.nutrition || []
  const days = (menu.days || []).map((day) =>
    Object.assign({}, day, {
      meals: normalizeDayMeals(day),
    })
  )
  return Object.assign({}, menu, shopping, {
    days,
    nutrition,
    weekLayout: buildWeekLayout(days, nutrition),
    nutritionAnalysis: buildNutritionAnalysis(
      Object.assign({}, menu, { days, shoppingCategories: shopping.shoppingCategories })
    ),
  })
}

function calcCategoryGridHeight(itemCount) {
  if (!itemCount) return 0
  const rows = Math.ceil(itemCount / 3)
  return rows * 40 + Math.max(0, rows - 1) * 12
}

function calcShoppingCategoriesHeight(categories) {
  if (!categories || !categories.length) return 0
  let height = 52
  categories.forEach((cat) => {
    height += 34 + calcCategoryGridHeight(cat.items.length) + 12
  })
  return height + 20
}

module.exports = {
  MEAL_DEFS,
  SHOP_CATEGORY_DEFS,
  parseMealString,
  normalizeMealDishes,
  normalizeDayMeals,
  normalizeShoppingCategories,
  normalizeWeeklyMenu,
  buildWeekLayout,
  calcCategoryGridHeight,
  calcShoppingCategoriesHeight,
  calcDayMealsHeight,
  calcDishTreeHeight,
}
