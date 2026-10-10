/**
 * 能不能吃 — 基于 WHO / AAP 常见建议整理的静态数据
 * 后续可扩展或由 AI 补充
 */

const { getCanEatItems } = require('./cms')

const FOOD_DB = [
  {
    keywords: ['虾', '虾仁', '海鲜', '螃蟹', '贝类'],
    emoji: '🦐',
    name: '虾',
    rules: {
      '6-8': { can: false, note: '6-8个月不建议，易引起过敏', recommend: [], avoid: ['所有海鲜'] },
      '8-10': {
        can: 'caution',
        note: '可少量尝试，需观察过敏',
        pairings: ['西兰花', '胡萝卜', '软米饭'],
        seasonings: [
          { name: '姜', amount: '1片，约2克' },
          { name: '植物油', amount: '半茶匙，约2毫升' },
        ],
        methods: ['虾仁蒸熟剁成泥', '虾仁蔬菜软粥'],
        avoid: ['整颗虾仁', '油炸'],
      },
      '10-12': {
        can: true,
        note: '可以尝试',
        pairings: ['西兰花', '番茄', '米饭'],
        seasonings: [
          { name: '葱', amount: '约2克' },
          { name: '儿童酱油', amount: '3滴，约0.5毫升' },
        ],
        methods: ['清蒸虾仁剁碎', '虾仁蛋羹'],
        avoid: ['油炸', '整颗虾仁'],
      },
      '1-2': {
        can: true,
        note: '一岁以上可以适量吃',
        pairings: ['西兰花', '玉米', '米饭'],
        seasonings: [
          { name: '姜', amount: '1片，约2克' },
          { name: '儿童酱油', amount: '半勺，约3毫升' },
        ],
        methods: ['清炒虾仁', '虾仁蔬菜饭'],
        avoid: ['油炸', '过量'],
      },
    },
  },
  {
    keywords: ['蜂蜜'],
    emoji: '🍯',
    name: '蜂蜜',
    rules: {
      '6-8': { can: false, note: '一岁以内不建议，可能含肉毒杆菌', recommend: [], avoid: ['任何蜂蜜制品'] },
      '8-10': { can: false, note: '一岁以内不建议', recommend: [], avoid: ['任何蜂蜜制品'] },
      '10-12': { can: false, note: '一岁以内不建议', recommend: [], avoid: ['任何蜂蜜制品'] },
      '1-2': { can: true, note: '一岁以上可少量食用', recommend: ['少量添加'], avoid: ['过量'] },
    },
  },
  {
    keywords: ['鸡蛋', '蛋', '蛋黄', '蛋白'],
    emoji: '🥚',
    name: '鸡蛋',
    rules: {
      '6-8': { can: 'caution', note: '可先尝试蛋黄，观察过敏', recommend: ['蛋黄泥'], avoid: ['蛋白', '溏心蛋'] },
      '8-10': {
        can: true,
        note: '可尝试全蛋',
        pairings: ['西兰花', '番茄', '软米饭'],
        seasonings: [{ name: '亚麻籽油', amount: '3滴，约0.5毫升' }],
        methods: ['蒸蛋羹', '蛋黄泥拌粥'],
        avoid: ['溏心蛋', '油炸'],
      },
      '10-12': {
        can: true,
        note: '可以吃',
        pairings: ['青菜', '胡萝卜', '面条'],
        seasonings: [
          { name: '葱', amount: '约2克' },
          { name: '植物油', amount: '半茶匙，约2毫升' },
        ],
        methods: ['水煮蛋碾碎', '蔬菜蛋花面'],
        avoid: ['生蛋', '溏心'],
      },
      '1-2': {
        can: true,
        note: '完全可以',
        pairings: ['番茄', '青菜', '米饭'],
        seasonings: [
          { name: '儿童酱油', amount: '半勺，约3毫升' },
          { name: '葱', amount: '约3克' },
        ],
        methods: ['番茄炒蛋', '蒸蛋羹配饭'],
        avoid: ['生蛋'],
      },
    },
  },
  {
    keywords: ['牛奶', '鲜奶'],
    emoji: '🥛',
    name: '牛奶',
    rules: {
      '6-8': { can: false, note: '12个月前不建议喝鲜奶', recommend: ['母乳或配方奶'], avoid: ['纯牛奶'] },
      '8-10': { can: false, note: '12个月前不建议', recommend: ['配方奶'], avoid: ['纯牛奶'] },
      '10-12': { can: 'caution', note: '接近1岁可少量尝试', recommend: ['少量加温奶'], avoid: ['大量饮用'] },
      '1-2': { can: true, note: '一岁以上可以喝', recommend: ['温牛奶', '酸奶'], avoid: ['冰牛奶过量'] },
    },
  },
  {
    keywords: ['盐', '酱油', '调味'],
    emoji: '🧂',
    name: '盐/调味品',
    rules: {
      '6-8': { can: false, note: '1岁前不建议额外加盐', recommend: ['天然食材味道'], avoid: ['盐', '酱油', '味精'] },
      '8-10': { can: false, note: '仍不建议加盐', recommend: ['少油少盐'], avoid: ['重口味调味'] },
      '10-12': { can: 'caution', note: '可极少量', recommend: ['清淡口味'], avoid: ['重盐重油'] },
      '1-2': { can: true, note: '可少量调味', recommend: ['少盐少糖'], avoid: ['重口味'] },
    },
  },
  {
    keywords: ['花生', '坚果', '核桃', '杏仁'],
    emoji: '🥜',
    name: '坚果',
    rules: {
      '6-8': { can: false, note: '整颗坚果有窒息风险', recommend: [], avoid: ['整颗坚果'] },
      '8-10': { can: 'caution', note: '可花生酱形式少量尝试', recommend: ['花生酱（无颗粒）'], avoid: ['整颗', '碎粒'] },
      '10-12': { can: 'caution', note: '需磨碎或酱状', recommend: ['坚果粉', '坚果酱'], avoid: ['整颗'] },
      '1-2': { can: true, note: '可吃但需切碎', recommend: ['磨碎', '坚果酱'], avoid: ['整颗'] },
    },
  },
  {
    keywords: ['猕猴桃', '奇异果'],
    emoji: '🥝',
    name: '猕猴桃',
    rules: {
      '6-8': { can: true, note: '可作为水果引入', recommend: ['果泥'], avoid: ['整颗', '未熟'] },
      '8-10': { can: true, note: '可以吃', recommend: ['果泥', '小块'], avoid: ['未熟', '过量'] },
      '10-12': { can: true, note: '可以吃', recommend: ['切块', '果泥'], avoid: ['未熟'] },
      '1-2': { can: true, note: '完全可以', recommend: ['鲜食', '果泥'], avoid: ['未熟'] },
    },
  },
  {
    keywords: ['芒果'],
    emoji: '🥭',
    name: '芒果',
    rules: {
      '6-8': { can: 'caution', note: '易过敏，首次少量尝试', recommend: ['芒果泥'], avoid: ['大量', '未熟'] },
      '8-10': { can: true, note: '可尝试，观察过敏', recommend: ['果泥', '小块'], avoid: ['过量'] },
      '10-12': { can: true, note: '可以吃', recommend: ['鲜食', '果泥'], avoid: ['未熟'] },
      '1-2': { can: true, note: '完全可以', recommend: ['鲜食'], avoid: ['未熟'] },
    },
  },
  {
    keywords: ['菠菜'],
    emoji: '🥬',
    name: '菠菜',
    rules: {
      '6-8': { can: true, note: '焯水后食用，去草酸', recommend: ['菠菜泥'], avoid: ['生食', '未焯水'] },
      '8-10': { can: true, note: '焯水后食用', recommend: ['碎菜', '菜泥'], avoid: ['生食'] },
      '10-12': { can: true, note: '可以吃', recommend: ['焯水炒', '煮汤'], avoid: ['生食'] },
      '1-2': { can: true, note: '完全可以', recommend: ['炒', '汤', '馅'], avoid: ['生食'] },
    },
  },
  {
    keywords: ['牛肉'],
    emoji: '🥩',
    name: '牛肉',
    rules: {
      '6-8': { can: true, note: '优质铁来源，推荐引入', recommend: ['牛肉泥', '肉末'], avoid: ['大块', '油炸'] },
      '8-10': {
        can: true,
        note: '可以吃',
        pairings: ['西兰花', '胡萝卜', '土豆'],
        seasonings: [
          { name: '姜', amount: '1片，约2克' },
          { name: '植物油', amount: '1茶匙，约5毫升' },
        ],
        methods: ['牛肉末蒸蛋', '牛肉蔬菜粥'],
        avoid: ['大块'],
      },
      '10-12': {
        can: true,
        note: '可以吃',
        pairings: ['番茄', '土豆', '米饭'],
        seasonings: [
          { name: '葱', amount: '约2克' },
          { name: '儿童酱油', amount: '3滴，约0.5毫升' },
        ],
        methods: ['番茄牛肉碎', '牛肉软饭'],
        avoid: ['油炸'],
      },
      '1-2': {
        can: true,
        note: '完全可以',
        pairings: ['西兰花', '番茄', '米饭'],
        seasonings: [
          { name: '姜', amount: '1片，约2克' },
          { name: '儿童酱油', amount: '半勺，约3毫升' },
        ],
        methods: ['番茄炖牛肉', '牛肉蔬菜烩饭'],
        avoid: ['油炸'],
      },
    },
  },
]

function getFoodDb() {
  const remote = getCanEatItems()
  if (!remote.length) return FOOD_DB
  const names = new Set(remote.map((item) => item.name))
  return remote.concat(FOOD_DB.filter((item) => !names.has(item.name)))
}

function searchFood(query) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return null
  return getFoodDb().find((item) =>
    item.keywords.some((kw) => kw.includes(q) || q.includes(kw)) ||
    item.name.includes(q)
  )
}

function getCanEatResult(query, ageId) {
  const food = searchFood(query)
  if (!food) {
    return {
      found: false,
      query,
      message: '暂未收录该食材，建议首次少量尝试并观察过敏反应',
    }
  }
  const fallbackAgeId =
    ageId === '2-3' ? '1-2' : ageId === '4-5' || ageId === '6-7' ? '2+' : null
  const rule =
    food.rules[ageId] ||
    (fallbackAgeId && food.rules[fallbackAgeId]) ||
    food.rules['2+'] ||
    food.rules['1-2'] ||
    food.rules['8-10']
  return {
    found: true,
    emoji: food.emoji,
    name: food.name,
    can: rule.can,
    note: rule.note,
    pairings: rule.pairings || food.pairings || [],
    seasonings: rule.seasonings || food.seasonings || [],
    methods: rule.methods || rule.recommend || [],
    avoid: rule.avoid || [],
  }
}

module.exports = { FOOD_DB, getFoodDb, searchFood, getCanEatResult }
