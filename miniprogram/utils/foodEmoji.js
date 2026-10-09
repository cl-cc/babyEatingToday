const { INGREDIENTS } = require('./ingredients')
const { FOOD_DB } = require('./canEatData')

const CATEGORY_RULES = [
  // 水果 — 多字词优先，避免「桃」误匹配「猕猴桃」
  { pattern: /猕猴桃|奇异果/, emoji: '🥝' },
  { pattern: /菠萝|凤梨/, emoji: '🍍' },
  { pattern: /哈密瓜|甜瓜|香瓜/, emoji: '🍈' },
  { pattern: /蓝莓|黑莓|桑葚/, emoji: '🫐' },
  { pattern: /草莓/, emoji: '🍓' },
  { pattern: /樱桃/, emoji: '🍒' },
  { pattern: /荔枝|龙眼|桂圆/, emoji: '🍒' },
  { pattern: /椰子/, emoji: '🥥' },
  { pattern: /榴莲/, emoji: '🥭' },
  { pattern: /山竹/, emoji: '🫐' },
  { pattern: /石榴/, emoji: '🍎' },
  { pattern: /木瓜/, emoji: '🥭' },
  { pattern: /西红柿|番茄/, emoji: '🍅' },
  { pattern: /柿子/, emoji: '🍊' },
  { pattern: /西瓜/, emoji: '🍉' },
  { pattern: /香蕉/, emoji: '🍌' },
  { pattern: /苹果|蛇果/, emoji: '🍎' },
  { pattern: /芒果/, emoji: '🥭' },
  { pattern: /葡萄|提子/, emoji: '🍇' },
  { pattern: /橙|橘|柑|柚子|脐橙/, emoji: '🍊' },
  { pattern: /柠檬|青柠/, emoji: '🍋' },
  { pattern: /梨|雪梨|鸭梨/, emoji: '🍐' },
  { pattern: /水蜜桃|油桃|黄桃|蟠桃/, emoji: '🍑' },
  { pattern: /桃/, emoji: '🍑' },
  { pattern: /杏|李子|枇杷|杨梅|无花果/, emoji: '🍑' },

  // 肉类 / 禽类
  { pattern: /猪|排骨|腊肉|火腿|香肠|培根|里脊|五花肉|猪蹄/, emoji: '🥓' },
  { pattern: /牛|羊|驴|牛排|牛腩|羊肉|肉松/, emoji: '🥩' },
  { pattern: /鸡|鸭|鹅|鸽|鸡翅|鸡腿|鸡胸/, emoji: '🐔' },

  // 水产
  { pattern: /鱼|鲈|鲤|带鱼|三文鱼|鳕鱼|黄鱼|鲫鱼|草鱼|鲈鱼|鱼片/, emoji: '🐟' },
  { pattern: /虾|蟹|贝|螺|蚝|海鲜|鱿鱼|章鱼|扇贝|蛤蜊|海参/, emoji: '🦐' },

  // 蔬菜 — 具体菜名优先于泛「菜」
  { pattern: /西兰花|花菜|菜花/, emoji: '🥦' },
  { pattern: /胡萝卜/, emoji: '🥕' },
  { pattern: /萝卜|白萝卜/, emoji: '🥕' },
  { pattern: /土豆|马铃薯/, emoji: '🥔' },
  { pattern: /南瓜/, emoji: '🎃' },
  { pattern: /玉米/, emoji: '🌽' },
  { pattern: /红薯|地瓜|番薯|紫薯/, emoji: '🍠' },
  { pattern: /黄瓜|青瓜/, emoji: '🥒' },
  { pattern: /茄子/, emoji: '🍆' },
  { pattern: /青椒|彩椒|辣椒|柿子椒/, emoji: '🫑' },
  { pattern: /洋葱|大葱|小葱|香葱|蒜|姜/, emoji: '🧅' },
  { pattern: /蘑菇|香菇|平菇|金针菇|木耳|银耳/, emoji: '🍄' },
  { pattern: /豌豆|毛豆|扁豆|四季豆|豆角|豆芽/, emoji: '🫛' },
  { pattern: /藕|莲藕/, emoji: '🪷' },
  { pattern: /笋|芦笋|芹菜|莴笋/, emoji: '🎋' },
  { pattern: /菜|芹|豆苗|生菜|油麦|娃娃菜|卷心菜|白菜|菠菜|油菜|空心菜|茼蒿|芥蓝/, emoji: '🥬' },

  // 蛋奶豆
  { pattern: /蛋黄|蛋白|鸡蛋|鸭蛋|鹌鹑蛋|蛋羹|蛋花/, emoji: '🥚' },
  { pattern: /蛋/, emoji: '🥚' },
  { pattern: /奶|乳|酸奶|芝士|奶酪|配方奶/, emoji: '🥛' },
  { pattern: /豆腐|豆干|豆皮|腐竹|豆浆|豆花/, emoji: '🫘' },

  // 主食
  { pattern: /饭|米|粥|糯|米粉|米线/, emoji: '🍚' },
  { pattern: /面|粉|馒头|包子|饺子|馄饨|面条|意面|饼|煎饼|烧麦/, emoji: '🍜' },
  { pattern: /面包|吐司|三明治/, emoji: '🍞' },

  // 其他常见辅食
  { pattern: /蜂蜜/, emoji: '🍯' },
  { pattern: /坚果|花生|核桃|杏仁|腰果|开心果|榛子/, emoji: '🥜' },
  { pattern: /紫菜|海带|海苔/, emoji: '🌿' },
  { pattern: /汤|煲|炖/, emoji: '🍲' },
  { pattern: /蛋糕|甜品|糕|布丁|饼干/, emoji: '🍰' },
  { pattern: /薯|薯条/, emoji: '🍟' },
  { pattern: /肉丸|丸子/, emoji: '🍡' },
]

function guessFoodEmoji(name, options) {
  const opts = options || {}
  const emptyDefault = opts.emptyDefault || '➕'
  const fallback = opts.fallback || '✏️'
  const text = String(name || '').trim()

  if (!text) return emptyDefault

  const exact = INGREDIENTS.find((item) => item.name === text)
  if (exact) return exact.emoji

  const byLength = INGREDIENTS.slice().sort((a, b) => b.name.length - a.name.length)
  const partial = byLength.find((item) => text.includes(item.name) || item.name.includes(text))
  if (partial) return partial.emoji

  for (let i = 0; i < FOOD_DB.length; i++) {
    const food = FOOD_DB[i]
    if (food.keywords.some((kw) => text.includes(kw) || kw.includes(text))) {
      return food.emoji
    }
    if (text.includes(food.name) || food.name.includes(text)) {
      return food.emoji
    }
  }

  for (let i = 0; i < CATEGORY_RULES.length; i++) {
    const rule = CATEGORY_RULES[i]
    if (rule.pattern.test(text)) return rule.emoji
  }

  return fallback
}

module.exports = { guessFoodEmoji }
