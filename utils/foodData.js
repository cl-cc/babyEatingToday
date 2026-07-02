const { estimateCalories } = require('./nutritionHelper')

const AGE_GROUPS = [
  { id: '6-8', label: '6-8个月' },
  { id: '8-10', label: '8-10个月' },
  { id: '10-12', label: '10-12个月' },
  { id: '1-2', label: '1-2岁' },
  { id: '2+', label: '2岁以上' },
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
  ],
  '2+': [
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
        { emoji: '🫘', name: '麻婆豆腐（少辣）' },
      ],
      stars: 5,
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
  '2+': 30,
}

function getAgeLabel(ageId) {
  const group = AGE_GROUPS.find((a) => a.id === ageId)
  return group ? group.label : ageId
}

function getAgeMonths(ageId) {
  return AGE_MONTHS_MAP[ageId] || 9
}

module.exports = {
  AGE_GROUPS,
  AGE_MONTHS_MAP,
  FOOD_SETS,
  pickRandomSet,
  starsToArray,
  getAgeLabel,
  getAgeMonths,
}
