const INGREDIENTS = [
  { emoji: '🥩', name: '牛肉', category: '肉类' },
  { emoji: '🐔', name: '鸡肉', category: '肉类' },
  { emoji: '🐟', name: '鳕鱼', category: '肉类' },
  { emoji: '🦐', name: '虾仁', category: '肉类' },
  { emoji: '🥦', name: '西兰花', category: '蔬菜' },
  { emoji: '🥕', name: '胡萝卜', category: '蔬菜' },
  { emoji: '🥔', name: '土豆', category: '蔬菜' },
  { emoji: '🥬', name: '青菜', category: '蔬菜' },
  { emoji: '🎃', name: '南瓜', category: '蔬菜' },
  { emoji: '🍅', name: '番茄', category: '蔬菜' },
  { emoji: '🌽', name: '玉米', category: '蔬菜' },
  { emoji: '🍠', name: '红薯', category: '蔬菜' },
  { emoji: '🥚', name: '鸡蛋', category: '蛋奶' },
  { emoji: '🥛', name: '牛奶', category: '蛋奶' },
  { emoji: '🧀', name: '奶酪', category: '蛋奶' },
  { emoji: '🍚', name: '米饭', category: '主食' },
  { emoji: '🍜', name: '面条', category: '主食' },
  { emoji: '🍞', name: '面包', category: '主食' },
  { emoji: '🍎', name: '苹果', category: '水果' },
  { emoji: '🍌', name: '香蕉', category: '水果' },
  { emoji: '🥝', name: '猕猴桃', category: '水果' },
  { emoji: '🫘', name: '豆腐', category: '豆制品' },
]

const CATEGORIES = ['全部', '肉类', '蔬菜', '蛋奶', '主食', '水果', '豆制品']

const CATEGORY_ORDER = ['肉类', '蔬菜', '蛋奶', '主食', '水果', '豆制品']

function filterByCategory(category) {
  if (!category || category === '全部') return INGREDIENTS
  return INGREDIENTS.filter((i) => i.category === category)
}

function groupByCategory(activeCategory, options) {
  const {
    selectedNames = [],
    allergyNames = [],
    ingredients = INGREDIENTS,
    categoryOrder = CATEGORY_ORDER,
  } = options || {}
  const categories =
    !activeCategory || activeCategory === '全部' ? categoryOrder : [activeCategory]

  return categories
    .map((category) => ({
      category,
      items: ingredients
        .filter((i) => i.category === category)
        .filter((i) => !allergyNames.some((a) => i.name.includes(a)))
        .map((i) =>
          Object.assign({}, i, { selected: selectedNames.includes(i.name) })
        ),
    }))
    .filter((g) => g.items.length > 0)
}

module.exports = { INGREDIENTS, CATEGORIES, CATEGORY_ORDER, filterByCategory, groupByCategory }
