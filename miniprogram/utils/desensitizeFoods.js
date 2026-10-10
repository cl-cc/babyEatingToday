const CATEGORIES = [
  { id: 'grain', name: '谷物' },
  { id: 'veg', name: '蔬菜' },
  { id: 'fruit', name: '水果' },
  { id: 'meat', name: '肉类' },
  { id: 'seafood', name: '海鲜' },
  { id: 'egg_dairy', name: '蛋奶' },
  { id: 'bean', name: '豆&坚果' },
]

const FOODS = [
  // 谷物 - 主食
  { name: '米饭', emoji: '🍚', categoryId: 'grain', subCategory: '主食' },
  { name: '面条', emoji: '🍜', categoryId: 'grain', subCategory: '主食' },
  { name: '挂面', emoji: '🍜', categoryId: 'grain', subCategory: '主食' },
  { name: '馒头', emoji: '🥯', categoryId: 'grain', subCategory: '主食' },
  { name: '包子', emoji: '🥟', categoryId: 'grain', subCategory: '主食' },
  { name: '面包', emoji: '🍞', categoryId: 'grain', subCategory: '主食' },
  { name: '花卷', emoji: '🥯', categoryId: 'grain', subCategory: '主食' },
  { name: '饺子', emoji: '🥟', categoryId: 'grain', subCategory: '主食' },
  { name: '馄饨', emoji: '🥟', categoryId: 'grain', subCategory: '主食' },
  { name: '米粉', emoji: '🍚', categoryId: 'grain', subCategory: '主食' },
  { name: '意面', emoji: '🍝', categoryId: 'grain', subCategory: '主食' },
  // 谷物 - 杂粮
  { name: '燕麦', emoji: '🌾', categoryId: 'grain', subCategory: '杂粮' },
  { name: '小米', emoji: '🌾', categoryId: 'grain', subCategory: '杂粮' },
  { name: '玉米', emoji: '🌽', categoryId: 'grain', subCategory: '杂粮' },
  { name: '藜麦', emoji: '🌾', categoryId: 'grain', subCategory: '杂粮' },
  { name: '黑米', emoji: '🌾', categoryId: 'grain', subCategory: '杂粮' },
  { name: '薏米', emoji: '🌾', categoryId: 'grain', subCategory: '杂粮' },
  { name: '荞麦', emoji: '🌾', categoryId: 'grain', subCategory: '杂粮' },
  { name: '糙米', emoji: '🌾', categoryId: 'grain', subCategory: '杂粮' },
  { name: '紫米', emoji: '🌾', categoryId: 'grain', subCategory: '杂粮' },
  { name: '高粱米', emoji: '🌾', categoryId: 'grain', subCategory: '杂粮' },

  // 蔬菜 - 绿叶菜
  { name: '菠菜', emoji: '🥬', categoryId: 'veg', subCategory: '绿叶菜' },
  { name: '青菜', emoji: '🥬', categoryId: 'veg', subCategory: '绿叶菜' },
  { name: '生菜', emoji: '🥬', categoryId: 'veg', subCategory: '绿叶菜' },
  { name: '油菜', emoji: '🥬', categoryId: 'veg', subCategory: '绿叶菜' },
  { name: '小白菜', emoji: '🥬', categoryId: 'veg', subCategory: '绿叶菜' },
  { name: '空心菜', emoji: '🥬', categoryId: 'veg', subCategory: '绿叶菜' },
  { name: '芹菜', emoji: '🥬', categoryId: 'veg', subCategory: '绿叶菜' },
  { name: '苋菜', emoji: '🥬', categoryId: 'veg', subCategory: '绿叶菜' },
  { name: '芥蓝', emoji: '🥬', categoryId: 'veg', subCategory: '绿叶菜' },
  { name: '油麦菜', emoji: '🥬', categoryId: 'veg', subCategory: '绿叶菜' },
  // 蔬菜 - 根茎类
  { name: '胡萝卜', emoji: '🥕', categoryId: 'veg', subCategory: '根茎类' },
  { name: '土豆', emoji: '🥔', categoryId: 'veg', subCategory: '根茎类' },
  { name: '红薯', emoji: '🍠', categoryId: 'veg', subCategory: '根茎类' },
  { name: '白萝卜', emoji: '🥕', categoryId: 'veg', subCategory: '根茎类' },
  { name: '莲藕', emoji: '🪷', categoryId: 'veg', subCategory: '根茎类' },
  { name: '山药', emoji: '🍠', categoryId: 'veg', subCategory: '根茎类' },
  { name: '芋头', emoji: '🍠', categoryId: 'veg', subCategory: '根茎类' },
  { name: '莴笋', emoji: '🥬', categoryId: 'veg', subCategory: '根茎类' },
  { name: '洋葱', emoji: '🧅', categoryId: 'veg', subCategory: '根茎类' },
  // 蔬菜 - 瓜果类
  { name: '南瓜', emoji: '🎃', categoryId: 'veg', subCategory: '瓜果类' },
  { name: '黄瓜', emoji: '🥒', categoryId: 'veg', subCategory: '瓜果类' },
  { name: '番茄', emoji: '🍅', categoryId: 'veg', subCategory: '瓜果类' },
  { name: '冬瓜', emoji: '🥒', categoryId: 'veg', subCategory: '瓜果类' },
  { name: '茄子', emoji: '🍆', categoryId: 'veg', subCategory: '瓜果类' },
  { name: '青椒', emoji: '🫑', categoryId: 'veg', subCategory: '瓜果类' },
  { name: '彩椒', emoji: '🫑', categoryId: 'veg', subCategory: '瓜果类' },
  { name: '西葫芦', emoji: '🥒', categoryId: 'veg', subCategory: '瓜果类' },
  { name: '丝瓜', emoji: '🥒', categoryId: 'veg', subCategory: '瓜果类' },
  // 蔬菜 - 花菜类
  { name: '西兰花', emoji: '🥦', categoryId: 'veg', subCategory: '花菜类' },
  { name: '花菜', emoji: '🥦', categoryId: 'veg', subCategory: '花菜类' },
  { name: '卷心菜', emoji: '🥬', categoryId: 'veg', subCategory: '花菜类' },
  { name: '娃娃菜', emoji: '🥬', categoryId: 'veg', subCategory: '花菜类' },
  // 蔬菜 - 菌菇
  { name: '香菇', emoji: '🍄', categoryId: 'veg', subCategory: '菌菇' },
  { name: '木耳', emoji: '🍄', categoryId: 'veg', subCategory: '菌菇' },
  { name: '金针菇', emoji: '🍄', categoryId: 'veg', subCategory: '菌菇' },
  { name: '平菇', emoji: '🍄', categoryId: 'veg', subCategory: '菌菇' },
  { name: '口蘑', emoji: '🍄', categoryId: 'veg', subCategory: '菌菇' },
  // 蔬菜 - 豆荚类
  { name: '豌豆', emoji: '🫛', categoryId: 'veg', subCategory: '豆荚类' },
  { name: '毛豆', emoji: '🫛', categoryId: 'veg', subCategory: '豆荚类' },
  { name: '四季豆', emoji: '🫛', categoryId: 'veg', subCategory: '豆荚类' },
  { name: '荷兰豆', emoji: '🫛', categoryId: 'veg', subCategory: '豆荚类' },

  // 水果 - 常见水果
  { name: '苹果', emoji: '🍎', categoryId: 'fruit', subCategory: '常见水果' },
  { name: '香蕉', emoji: '🍌', categoryId: 'fruit', subCategory: '常见水果' },
  { name: '梨', emoji: '🍐', categoryId: 'fruit', subCategory: '常见水果' },
  { name: '葡萄', emoji: '🍇', categoryId: 'fruit', subCategory: '常见水果' },
  { name: '橙子', emoji: '🍊', categoryId: 'fruit', subCategory: '常见水果' },
  { name: '橘子', emoji: '🍊', categoryId: 'fruit', subCategory: '常见水果' },
  { name: '柚子', emoji: '🍊', categoryId: 'fruit', subCategory: '常见水果' },
  { name: '桃子', emoji: '🍑', categoryId: 'fruit', subCategory: '常见水果' },
  { name: '李子', emoji: '🍑', categoryId: 'fruit', subCategory: '常见水果' },
  { name: '杏', emoji: '🍑', categoryId: 'fruit', subCategory: '常见水果' },
  // 水果 - 浆果
  { name: '蓝莓', emoji: '🫐', categoryId: 'fruit', subCategory: '浆果' },
  { name: '草莓', emoji: '🍓', categoryId: 'fruit', subCategory: '浆果' },
  { name: '猕猴桃', emoji: '🥝', categoryId: 'fruit', subCategory: '浆果' },
  { name: '樱桃', emoji: '🍒', categoryId: 'fruit', subCategory: '浆果' },
  { name: '杨梅', emoji: '🍒', categoryId: 'fruit', subCategory: '浆果' },
  { name: '覆盆子', emoji: '🫐', categoryId: 'fruit', subCategory: '浆果' },
  // 水果 - 热带水果
  { name: '牛油果', emoji: '🥑', categoryId: 'fruit', subCategory: '热带水果' },
  { name: '芒果', emoji: '🥭', categoryId: 'fruit', subCategory: '热带水果' },
  { name: '菠萝', emoji: '🍍', categoryId: 'fruit', subCategory: '热带水果' },
  { name: '火龙果', emoji: '🐉', categoryId: 'fruit', subCategory: '热带水果' },
  { name: '榴莲', emoji: '🥭', categoryId: 'fruit', subCategory: '热带水果' },
  { name: '山竹', emoji: '🥭', categoryId: 'fruit', subCategory: '热带水果' },
  { name: '荔枝', emoji: '🍒', categoryId: 'fruit', subCategory: '热带水果' },
  { name: '龙眼', emoji: '🍒', categoryId: 'fruit', subCategory: '热带水果' },
  { name: '椰子', emoji: '🥥', categoryId: 'fruit', subCategory: '热带水果' },
  { name: '百香果', emoji: '🥭', categoryId: 'fruit', subCategory: '热带水果' },
  // 水果 - 瓜果类
  { name: '西瓜', emoji: '🍉', categoryId: 'fruit', subCategory: '瓜果类' },
  { name: '哈密瓜', emoji: '🍈', categoryId: 'fruit', subCategory: '瓜果类' },
  { name: '小番茄', emoji: '🍅', categoryId: 'fruit', subCategory: '瓜果类' },
  { name: '甜瓜', emoji: '🍈', categoryId: 'fruit', subCategory: '瓜果类' },
  // 水果 - 干果
  { name: '红枣', emoji: '🫒', categoryId: 'fruit', subCategory: '干果' },
  { name: '葡萄干', emoji: '🍇', categoryId: 'fruit', subCategory: '干果' },
  { name: '无花果', emoji: '🫒', categoryId: 'fruit', subCategory: '干果' },
  { name: '山楂', emoji: '🍎', categoryId: 'fruit', subCategory: '干果' },

  // 肉类 - 红肉
  { name: '猪肉', emoji: '🥩', categoryId: 'meat', subCategory: '红肉' },
  { name: '猪里脊', emoji: '🥩', categoryId: 'meat', subCategory: '红肉' },
  { name: '排骨', emoji: '🍖', categoryId: 'meat', subCategory: '红肉' },
  { name: '牛肉', emoji: '🥩', categoryId: 'meat', subCategory: '红肉' },
  { name: '牛排', emoji: '🥩', categoryId: 'meat', subCategory: '红肉' },
  { name: '羊肉', emoji: '🍖', categoryId: 'meat', subCategory: '红肉' },
  // 肉类 - 白肉
  { name: '鸡肉', emoji: '🍗', categoryId: 'meat', subCategory: '白肉' },
  { name: '鸡胸肉', emoji: '🍗', categoryId: 'meat', subCategory: '白肉' },
  { name: '鸡翅', emoji: '🍗', categoryId: 'meat', subCategory: '白肉' },
  { name: '鸡腿', emoji: '🍗', categoryId: 'meat', subCategory: '白肉' },
  { name: '鸭肉', emoji: '🦆', categoryId: 'meat', subCategory: '白肉' },
  { name: '鸭腿', emoji: '🦆', categoryId: 'meat', subCategory: '白肉' },
  { name: '火鸡肉', emoji: '🦃', categoryId: 'meat', subCategory: '白肉' },
  // 肉类 - 内脏
  { name: '猪肝', emoji: '🥩', categoryId: 'meat', subCategory: '内脏' },
  { name: '鸡肝', emoji: '🍗', categoryId: 'meat', subCategory: '内脏' },
  { name: '猪心', emoji: '🥩', categoryId: 'meat', subCategory: '内脏' },

  // 海鲜 - 鱼类
  { name: '鳕鱼', emoji: '🐟', categoryId: 'seafood', subCategory: '鱼类' },
  { name: '三文鱼', emoji: '🐟', categoryId: 'seafood', subCategory: '鱼类' },
  { name: '带鱼', emoji: '🐟', categoryId: 'seafood', subCategory: '鱼类' },
  { name: '鲈鱼', emoji: '🐟', categoryId: 'seafood', subCategory: '鱼类' },
  { name: '黄花鱼', emoji: '🐟', categoryId: 'seafood', subCategory: '鱼类' },
  { name: '比目鱼', emoji: '🐟', categoryId: 'seafood', subCategory: '鱼类' },
  { name: '巴沙鱼', emoji: '🐟', categoryId: 'seafood', subCategory: '鱼类' },
  { name: '银鱼', emoji: '🐟', categoryId: 'seafood', subCategory: '鱼类' },
  { name: '龙利鱼', emoji: '🐟', categoryId: 'seafood', subCategory: '鱼类' },
  // 海鲜 - 虾蟹
  { name: '虾仁', emoji: '🦐', categoryId: 'seafood', subCategory: '虾蟹' },
  { name: '螃蟹', emoji: '🦀', categoryId: 'seafood', subCategory: '虾蟹' },
  { name: '龙虾', emoji: '🦞', categoryId: 'seafood', subCategory: '虾蟹' },
  { name: '基围虾', emoji: '🦐', categoryId: 'seafood', subCategory: '虾蟹' },
  // 海鲜 - 贝类
  { name: '扇贝', emoji: '🐚', categoryId: 'seafood', subCategory: '贝类' },
  { name: '蛤蜊', emoji: '🐚', categoryId: 'seafood', subCategory: '贝类' },
  { name: '牡蛎', emoji: '🦪', categoryId: 'seafood', subCategory: '贝类' },
  { name: '花甲', emoji: '🐚', categoryId: 'seafood', subCategory: '贝类' },
  // 海鲜 - 其他
  { name: '鱿鱼', emoji: '🦑', categoryId: 'seafood', subCategory: '其他海鲜' },
  { name: '墨鱼', emoji: '🦑', categoryId: 'seafood', subCategory: '其他海鲜' },
  { name: '海参', emoji: '🥒', categoryId: 'seafood', subCategory: '其他海鲜' },
  { name: '海带', emoji: '🥬', categoryId: 'seafood', subCategory: '其他海鲜' },
  { name: '紫菜', emoji: '🥬', categoryId: 'seafood', subCategory: '其他海鲜' },

  // 蛋奶 - 蛋类
  { name: '鸡蛋', emoji: '🥚', categoryId: 'egg_dairy', subCategory: '蛋类' },
  { name: '鸭蛋', emoji: '🥚', categoryId: 'egg_dairy', subCategory: '蛋类' },
  { name: '鹌鹑蛋', emoji: '🥚', categoryId: 'egg_dairy', subCategory: '蛋类' },
  { name: '鸽子蛋', emoji: '🥚', categoryId: 'egg_dairy', subCategory: '蛋类' },
  // 蛋奶 - 奶制品
  { name: '牛奶', emoji: '🥛', categoryId: 'egg_dairy', subCategory: '奶制品' },
  { name: '酸奶', emoji: '🥛', categoryId: 'egg_dairy', subCategory: '奶制品' },
  { name: '奶酪', emoji: '🧀', categoryId: 'egg_dairy', subCategory: '奶制品' },
  { name: '配方奶', emoji: '🍼', categoryId: 'egg_dairy', subCategory: '奶制品' },
  { name: '黄油', emoji: '🧈', categoryId: 'egg_dairy', subCategory: '奶制品' },
  { name: '淡奶油', emoji: '🥛', categoryId: 'egg_dairy', subCategory: '奶制品' },

  // 豆&坚果 - 豆制品
  { name: '豆腐', emoji: '🫘', categoryId: 'bean', subCategory: '豆制品' },
  { name: '豆浆', emoji: '🫘', categoryId: 'bean', subCategory: '豆制品' },
  { name: '豆干', emoji: '🫘', categoryId: 'bean', subCategory: '豆制品' },
  { name: '腐竹', emoji: '🫘', categoryId: 'bean', subCategory: '豆制品' },
  { name: '豆腐皮', emoji: '🫘', categoryId: 'bean', subCategory: '豆制品' },
  { name: '纳豆', emoji: '🫘', categoryId: 'bean', subCategory: '豆制品' },
  // 豆&坚果 - 豆类
  { name: '黄豆', emoji: '🫘', categoryId: 'bean', subCategory: '豆类' },
  { name: '黑豆', emoji: '🫘', categoryId: 'bean', subCategory: '豆类' },
  { name: '红豆', emoji: '🫘', categoryId: 'bean', subCategory: '豆类' },
  { name: '绿豆', emoji: '🫘', categoryId: 'bean', subCategory: '豆类' },
  { name: '芸豆', emoji: '🫘', categoryId: 'bean', subCategory: '豆类' },
  { name: '鹰嘴豆', emoji: '🫘', categoryId: 'bean', subCategory: '豆类' },
  { name: '扁豆', emoji: '🫘', categoryId: 'bean', subCategory: '豆类' },
  // 豆&坚果 - 坚果
  { name: '花生', emoji: '🥜', categoryId: 'bean', subCategory: '坚果' },
  { name: '核桃', emoji: '🌰', categoryId: 'bean', subCategory: '坚果' },
  { name: '杏仁', emoji: '🌰', categoryId: 'bean', subCategory: '坚果' },
  { name: '腰果', emoji: '🌰', categoryId: 'bean', subCategory: '坚果' },
  { name: '开心果', emoji: '🌰', categoryId: 'bean', subCategory: '坚果' },
  { name: '松子', emoji: '🌰', categoryId: 'bean', subCategory: '坚果' },
  { name: '夏威夷果', emoji: '🌰', categoryId: 'bean', subCategory: '坚果' },
  { name: '板栗', emoji: '🌰', categoryId: 'bean', subCategory: '坚果' },
  { name: '南瓜籽', emoji: '🌰', categoryId: 'bean', subCategory: '坚果' },
  { name: '芝麻', emoji: '🌰', categoryId: 'bean', subCategory: '坚果' },
]

const CATEGORY_MAP = CATEGORIES.reduce((map, item) => {
  map[item.id] = item.name
  return map
}, {})

function getCategoryName(categoryId) {
  return CATEGORY_MAP[categoryId] || ''
}

function listFoods(categoryId, filter, allergyNames, eatenNames) {
  const allergic = new Set(allergyNames || [])
  const eaten = new Set(eatenNames || [])
  let items = FOODS.filter((f) => f.categoryId === categoryId)

  if (filter === 'uneaten') {
    items = items.filter((f) => !eaten.has(f.name))
  } else if (filter === 'eaten') {
    items = items.filter((f) => eaten.has(f.name))
  } else if (filter === 'allergic') {
    items = items.filter((f) => allergic.has(f.name))
  }

  return items.map((f) =>
    Object.assign({}, f, {
      categoryName: getCategoryName(f.categoryId),
      allergic: allergic.has(f.name),
      eaten: eaten.has(f.name),
    })
  )
}

function findFood(name) {
  const item = FOODS.find((f) => f.name === name)
  if (!item) return null
  return Object.assign({}, item, { categoryName: getCategoryName(item.categoryId) })
}

function listFoodsFrom(foods, categoryMap, categoryId, filter, allergyNames, eatenNames) {
  const allergic = new Set(allergyNames || [])
  const eaten = new Set(eatenNames || [])
  let items = (foods || []).filter((f) => f.categoryId === categoryId)

  if (filter === 'uneaten') {
    items = items.filter((f) => !eaten.has(f.name))
  } else if (filter === 'eaten') {
    items = items.filter((f) => eaten.has(f.name))
  } else if (filter === 'allergic') {
    items = items.filter((f) => allergic.has(f.name))
  }

  return items.map((f) =>
    Object.assign({}, f, {
      categoryName: (categoryMap && categoryMap[f.categoryId]) || getCategoryName(f.categoryId),
      allergic: allergic.has(f.name),
      eaten: eaten.has(f.name),
    })
  )
}

function findFoodFrom(foods, categoryMap, name) {
  const item = (foods || []).find((f) => f.name === name)
  if (!item) return null
  return Object.assign({}, item, {
    categoryName: (categoryMap && categoryMap[item.categoryId]) || getCategoryName(item.categoryId),
  })
}

module.exports = {
  CATEGORIES,
  FOODS,
  CATEGORY_MAP,
  listFoods,
  findFood,
  getCategoryName,
  listFoodsFrom,
  findFoodFrom,
}
