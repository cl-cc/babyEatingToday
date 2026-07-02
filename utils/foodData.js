const { estimateCalories } = require('./nutritionHelper')

const AGE_GROUPS = [
  { id: '6-8', label: '6-8个月' },
  { id: '8-10', label: '8-10个月' },
  { id: '10-12', label: '10-12个月' },
  { id: '1-2', label: '1-2岁' },
  { id: '2-3', label: '2-3岁' },
  { id: '4-5', label: '4-5岁' },
  { id: '6-7', label: '6-7岁' },
]

const FOOD_SETS = {
  '6-8': [
    {
      foods: [
        { emoji: '🥩', name: '牛肉泥' },
        { emoji: '🥦', name: '西兰花泥' },
        { emoji: '🍚', name: '米糊' },
        { emoji: '🥚', name: '蛋黄泥' },
      ],
      stars: 5,
    },
    {
      foods: [
        { emoji: '🐟', name: '鳕鱼泥' },
        { emoji: '🎃', name: '南瓜泥' },
        { emoji: '🍎', name: '苹果泥' },
        { emoji: '🥕', name: '胡萝卜泥' },
      ],
      stars: 4,
    },
    {
      foods: [
        { emoji: '🐔', name: '鸡肉泥' },
        { emoji: '🍠', name: '红薯泥' },
        { emoji: '🥬', name: '菠菜泥' },
        { emoji: '🍌', name: '香蕉泥' },
      ],
      stars: 5,
    },
  ],
  '8-10': [
    {
      foods: [
        { emoji: '🥩', name: '牛肉' },
        { emoji: '🥦', name: '西兰花' },
        { emoji: '🍚', name: '米饭' },
        { emoji: '🥚', name: '鸡蛋羹' },
      ],
      stars: 5,
    },
    {
      foods: [
        { emoji: '🐟', name: '三文鱼' },
        { emoji: '🍅', name: '番茄' },
        { emoji: '🍜', name: '面条' },
        { emoji: '🧀', name: '奶酪碎' },
      ],
      stars: 4,
    },
    {
      foods: [
        { emoji: '🐔', name: '鸡肉丸' },
        { emoji: '🌽', name: '玉米' },
        { emoji: '🍚', name: '软米饭' },
        { emoji: '🥔', name: '土豆泥' },
      ],
      stars: 5,
    },
    {
      foods: [
        { emoji: '🐟', name: '鳕鱼' },
        { emoji: '🎃', name: '南瓜' },
        { emoji: '🥔', name: '土豆' },
        { emoji: '🍚', name: '软米饭' },
      ],
      stars: 5,
    },
    {
      foods: [
        { emoji: '🫘', name: '豆腐' },
        { emoji: '🍅', name: '番茄' },
        { emoji: '🥬', name: '菠菜' },
        { emoji: '🍜', name: '面条' },
      ],
      stars: 4,
    },
    {
      foods: [
        { emoji: '🥚', name: '蒸蛋' },
        { emoji: '🌽', name: '玉米粒' },
        { emoji: '🍠', name: '红薯泥' },
        { emoji: '🐔', name: '鸡肉松' },
      ],
      stars: 4,
    },
  ],
  '10-12': [
    {
      foods: [
        { emoji: '🥩', name: '牛肉碎' },
        { emoji: '🥦', name: '西兰花' },
        { emoji: '🍚', name: '杂粮饭' },
        { emoji: '🥚', name: '蒸蛋' },
      ],
      stars: 5,
    },
    {
      foods: [
        { emoji: '🦐', name: '虾仁' },
        { emoji: '🥬', name: '青菜' },
        { emoji: '🍲', name: '小米粥' },
        { emoji: '🍄', name: '香菇' },
      ],
      stars: 4,
    },
    {
      foods: [
        { emoji: '🐟', name: '鲈鱼' },
        { emoji: '🥕', name: '胡萝卜' },
        { emoji: '🍚', name: '米饭' },
        { emoji: '🫘', name: '豆腐' },
      ],
      stars: 5,
    },
    {
      foods: [
        { emoji: '🐔', name: '鸡肉碎' },
        { emoji: '🍅', name: '番茄' },
        { emoji: '🍜', name: '软面条' },
        { emoji: '🥬', name: '菠菜' },
      ],
      stars: 4,
    },
    {
      foods: [
        { emoji: '🫘', name: '豆腐' },
        { emoji: '🎃', name: '南瓜' },
        { emoji: '🍚', name: '小米饭' },
        { emoji: '🍄', name: '香菇' },
      ],
      stars: 5,
    },
    {
      foods: [
        { emoji: '🥚', name: '蛋羹' },
        { emoji: '🌽', name: '玉米' },
        { emoji: '🐟', name: '鳕鱼' },
        { emoji: '🥔', name: '山药泥' },
      ],
      stars: 4,
    },
  ],
  '1-2': [
    {
      foods: [
        { emoji: '🥩', name: '牛肉' },
        { emoji: '🥦', name: '西兰花' },
        { emoji: '🍚', name: '米饭' },
        { emoji: '🥚', name: '鸡蛋羹' },
      ],
      stars: 5,
    },
    {
      foods: [
        { emoji: '🐔', name: '鸡腿肉' },
        { emoji: '🥗', name: '蔬菜沙拉' },
        { emoji: '🍝', name: '意面' },
        { emoji: '🥛', name: '牛奶' },
      ],
      stars: 4,
    },
    {
      foods: [
        { emoji: '🐟', name: '清蒸鱼' },
        { emoji: '🌽', name: '玉米排骨汤' },
        { emoji: '🍚', name: '米饭' },
        { emoji: '🥟', name: '小馄饨' },
      ],
      stars: 5,
    },
    {
      foods: [
        { emoji: '🦐', name: '虾仁' },
        { emoji: '🍳', name: '鸡蛋' },
        { emoji: '🥬', name: '青菜' },
        { emoji: '🍚', name: '米饭' },
      ],
      stars: 5,
    },
    {
      foods: [
        { emoji: '🫘', name: '豆腐' },
        { emoji: '🍅', name: '番茄' },
        { emoji: '🍝', name: '意面' },
        { emoji: '🎃', name: '南瓜' },
      ],
      stars: 4,
    },
    {
      foods: [
        { emoji: '🐟', name: '鳕鱼' },
        { emoji: '🥔', name: '土豆' },
        { emoji: '🥦', name: '西兰花' },
        { emoji: '🍲', name: '小米粥' },
      ],
      stars: 4,
    },
  ],
  '2-3': [
    {
      foods: [
        { emoji: '🥩', name: '番茄牛肉末' },
        { emoji: '🥦', name: '西兰花' },
        { emoji: '🍚', name: '软米饭' },
        { emoji: '🥚', name: '鸡蛋羹' },
      ],
      stars: 5,
    },
    {
      foods: [
        { emoji: '🐔', name: '鸡腿肉' },
        { emoji: '🥔', name: '土豆炖胡萝卜' },
        { emoji: '🍜', name: '青菜面条' },
        { emoji: '🍎', name: '苹果' },
      ],
      stars: 4,
    },
    {
      foods: [
        { emoji: '🦐', name: '虾仁炒蛋' },
        { emoji: '🥬', name: '青菜碎' },
        { emoji: '🍚', name: '米饭' },
        { emoji: '🫘', name: '肉末豆腐' },
      ],
      stars: 5,
    },
    {
      foods: [
        { emoji: '🐟', name: '茄汁龙利鱼' },
        { emoji: '🥔', name: '土豆炖胡萝卜' },
        { emoji: '🍚', name: '米饭' },
        { emoji: '🥬', name: '清炒生菜' },
      ],
      stars: 4,
    },
    {
      foods: [
        { emoji: '🐔', name: '香菇鸡丁' },
        { emoji: '🌽', name: '玉米炒蛋' },
        { emoji: '🍝', name: '番茄意面' },
        { emoji: '🍎', name: '苹果块' },
      ],
      stars: 5,
    },
    {
      foods: [
        { emoji: '🫘', name: '肉末豆腐' },
        { emoji: '🥬', name: '蒜蓉油麦菜' },
        { emoji: '🍚', name: '杂粮饭' },
        { emoji: '🍄', name: '菌菇汤' },
      ],
      stars: 4,
    },
  ],
  '4-5': [
    {
      foods: [
        { emoji: '🥩', name: '土豆牛肉' },
        { emoji: '🥦', name: '清炒西兰花' },
        { emoji: '🍚', name: '米饭' },
        { emoji: '🍲', name: '番茄蛋花汤' },
      ],
      stars: 5,
    },
    {
      foods: [
        { emoji: '🐔', name: '香菇鸡丁' },
        { emoji: '🌽', name: '玉米炒蛋' },
        { emoji: '🍝', name: '意面' },
        { emoji: '🍎', name: '苹果块' },
      ],
      stars: 5,
    },
    {
      foods: [
        { emoji: '🐟', name: '茄汁龙利鱼' },
        { emoji: '🥬', name: '蒜蓉生菜' },
        { emoji: '🍚', name: '杂粮饭' },
        { emoji: '🍄', name: '菌菇豆腐汤' },
      ],
      stars: 4,
    },
    {
      foods: [
        { emoji: '🦐', name: '虾仁滑蛋' },
        { emoji: '🎃', name: '南瓜小米粥' },
        { emoji: '🥔', name: '土豆丝' },
        { emoji: '🍐', name: '雪梨' },
      ],
      stars: 4,
    },
  ],
  '6-7': [
    {
      foods: [
        { emoji: '🥩', name: '番茄牛腩' },
        { emoji: '🥦', name: '蒜蓉西兰花' },
        { emoji: '🍚', name: '杂粮饭' },
        { emoji: '🥚', name: '葱花炒蛋' },
      ],
      stars: 5,
    },
    {
      foods: [
        { emoji: '🐔', name: '可乐鸡翅' },
        { emoji: '🥔', name: '土豆炖肉' },
        { emoji: '🍜', name: '青菜面条' },
        { emoji: '🍎', name: '苹果' },
      ],
      stars: 4,
    },
    {
      foods: [
        { emoji: '🦐', name: '虾仁炒蛋' },
        { emoji: '🥬', name: '清炒时蔬' },
        { emoji: '🍚', name: '米饭' },
        { emoji: '🫘', name: '肉末豆腐' },
      ],
      stars: 5,
    },
    {
      foods: [
        { emoji: '🐟', name: '红烧龙利鱼' },
        { emoji: '🌽', name: '玉米排骨汤' },
        { emoji: '🍚', name: '米饭' },
        { emoji: '🥬', name: '油麦菜' },
      ],
      stars: 4,
    },
  ],
}

function enrichSet(set, ageId) {
  const foods = set.foods.map((f) => ({
    ...f,
    calories: f.calories || estimateCalories(f.name),
  }))
  const seasonings = set.seasonings || []
  return {
    ...set,
    foods,
    seasonings,
    totalCalories: foods.reduce((s, f) => s + f.calories, 0),
  }
}

function pickRandomSet(ageId, excludeIndex = -1) {
  const sets = FOOD_SETS[ageId] || FOOD_SETS['8-10']
  if (sets.length === 1) return { set: enrichSet(sets[0], ageId), index: 0 }

  let index
  do {
    index = Math.floor(Math.random() * sets.length)
  } while (index === excludeIndex && sets.length > 1)

  return { set: enrichSet(sets[index], ageId), index }
}

function starsToArray(count) {
  return Array.from({ length: 5 }, (_, i) => i < count)
}

const AGE_MONTHS_MAP = {
  '6-8': 7,
  '8-10': 9,
  '10-12': 11,
  '1-2': 18,
  '2-3': 30,
  '4-5': 54,
  '6-7': 78,
}

function getAgeLabel(ageId) {
  const group = AGE_GROUPS.find((a) => a.id === ageId)
  return group ? group.label : ageId
}

function getAgeMonths(ageId) {
  return AGE_MONTHS_MAP[ageId] || 9
}

// 根据出生日期计算当前月龄（整数月）
function calcAgeMonths(birthDate) {
  if (!birthDate) return 0
  const parts = String(birthDate).split('-').map((n) => parseInt(n, 10))
  if (parts.length < 3 || parts.some((n) => isNaN(n))) return 0
  const birth = new Date(parts[0], parts[1] - 1, parts[2])
  const now = new Date()
  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth())
  if (now.getDate() < birth.getDate()) months -= 1
  return months < 0 ? 0 : months
}

// 根据月龄匹配最合适的年龄段 id
function getAgeIdByMonths(months) {
  const m = Number(months) || 0
  if (m < 8) return '6-8'
  if (m < 10) return '8-10'
  if (m < 12) return '10-12'
  if (m < 24) return '1-2'
  if (m < 48) return '2-3'
  if (m < 72) return '4-5'
  return '6-7'
}

module.exports = {
  AGE_GROUPS,
  AGE_MONTHS_MAP,
  FOOD_SETS,
  pickRandomSet,
  starsToArray,
  getAgeLabel,
  getAgeMonths,
  calcAgeMonths,
  getAgeIdByMonths,
}
