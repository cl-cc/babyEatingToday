const CATEGORY_COLORS = {
  肉类: '#FF8FAB',
  蔬菜: '#5ECFB8',
  主食: '#FFB088',
  蛋奶豆: '#FFD93D',
  水果: '#B8E986',
  调料: '#D4B8E8',
  其他: '#C8C8C8',
}

const LINE_COLORS = {
  protein: '#FF8FAB',
  fiber: '#5ECFB8',
  balance: '#FFB088',
}

const LINE_LABELS = {
  protein: '蛋白质',
  fiber: '膳食纤维',
  balance: '均衡度',
}

function clampScore(value) {
  return Math.max(55, Math.min(98, Math.round(Number(value) || 0)))
}

function collectDayText(day) {
  const chunks = [day.day || '']
  ;(day.meals || []).forEach((meal) => {
    ;(meal.dishes || []).forEach((dish) => {
      chunks.push(dish.name || '')
      ;(dish.details || []).forEach((detail) => chunks.push(String(detail)))
    })
  })
  ;['breakfast', 'lunch', 'dinner'].forEach((key) => {
    const meal = day[key]
    if (Array.isArray(meal)) {
      meal.forEach((item) => {
        if (typeof item === 'string') chunks.push(item)
        else if (item && item.name) {
          chunks.push(item.name)
          ;(item.details || []).forEach((d) => chunks.push(String(d)))
        }
      })
    } else if (typeof meal === 'string') {
      chunks.push(meal)
    }
  })
  return chunks.join(' ')
}

function scoreDayLocally(day) {
  const text = collectDayText(day)
  let protein = 62
  let fiber = 58
  let balance = 60

  if (/肉|鸡|牛|羊|鱼|虾|蟹|蛋|豆腐|奶|猪肝/.test(text)) protein += 14
  if (/菜|西兰|菠菜|芹菜|燕麦|玉米|红薯|水果|苹果|香蕉|猕猴桃|菌|菇/.test(text)) fiber += 14
  if (/肉|鱼|虾|蛋/.test(text) && /菜|蔬|西兰|胡萝卜|番茄/.test(text)) balance += 12
  if (/米|面|粥|饭|主食|土豆|红薯/.test(text)) balance += 8
  if (/早餐|午餐|晚餐/.test(text)) balance += 4

  return {
    day: day.day || '',
    protein: clampScore(protein),
    fiber: clampScore(fiber),
    balance: clampScore(balance),
  }
}

function buildCategoryShareFromShopping(shoppingCategories) {
  const list = (shoppingCategories || []).filter((cat) => cat.items && cat.items.length)
  const total = list.reduce((sum, cat) => sum + cat.items.length, 0)
  if (!total) {
    return [
      { label: '蔬菜', value: 30, color: CATEGORY_COLORS['蔬菜'] },
      { label: '肉类', value: 22, color: CATEGORY_COLORS['肉类'] },
      { label: '主食', value: 20, color: CATEGORY_COLORS['主食'] },
      { label: '蛋奶豆', value: 16, color: CATEGORY_COLORS['蛋奶豆'] },
      { label: '水果', value: 12, color: CATEGORY_COLORS['水果'] },
    ]
  }

  return list
    .map((cat) => ({
      label: cat.label || cat.key,
      value: Math.max(1, Math.round((cat.items.length / total) * 100)),
      color: CATEGORY_COLORS[cat.key] || CATEGORY_COLORS['其他'],
    }))
    .filter((item) => item.value > 0)
}

function normalizeCategoryShare(list) {
  if (!Array.isArray(list) || !list.length) return []
  return list
    .map((item) => ({
      label: String(item.label || item.name || '').trim(),
      value: Math.max(1, Math.round(Number(item.value || item.percent) || 0)),
      color: item.color || CATEGORY_COLORS[item.label] || '#FF8FAB',
    }))
    .filter((item) => item.label)
}

function normalizeDailyTrend(list, days) {
  if (Array.isArray(list) && list.length) {
    return list.map((item, index) => ({
      day: item.day || (days[index] && days[index].day) || `周${index + 1}`,
      protein: clampScore(item.protein),
      fiber: clampScore(item.fiber),
      balance: clampScore(item.balance),
    }))
  }
  return (days || []).map((day) => scoreDayLocally(day))
}

function buildNutritionAnalysis(menu) {
  const days = menu.days || []
  const fromAi = menu.nutritionAnalysis || menu.nutritionStats || null
  const categoryShare = normalizeCategoryShare(fromAi && fromAi.categoryShare).length
    ? normalizeCategoryShare(fromAi.categoryShare)
    : buildCategoryShareFromShopping(menu.shoppingCategories)
  const dailyTrend = normalizeDailyTrend(fromAi && fromAi.dailyTrend, days)

  return {
    categoryShare,
    dailyTrend,
    lineSeries: [
      { key: 'protein', label: LINE_LABELS.protein, color: LINE_COLORS.protein },
      { key: 'fiber', label: LINE_LABELS.fiber, color: LINE_COLORS.fiber },
      { key: 'balance', label: LINE_LABELS.balance, color: LINE_COLORS.balance },
    ],
  }
}

module.exports = {
  CATEGORY_COLORS,
  LINE_COLORS,
  buildNutritionAnalysis,
  buildCategoryShareFromShopping,
  scoreDayLocally,
}
