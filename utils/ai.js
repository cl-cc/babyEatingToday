/**
 * AI 服务层 — DeepSeek
 * 配置在 config/ai-secret.js，启动时自动加载
 */

let AI_CONFIG = {
  apiKey: '',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat',
  timeout: 90000,
}

try {
  const secret = require('../config/ai-secret')
  AI_CONFIG = { ...AI_CONFIG, ...secret }
} catch (e) {
  console.warn('[AI] 未找到 config/ai-secret.js')
}

function setAIConfig(config) {
  Object.assign(AI_CONFIG, config)
}

function isAIReady() {
  return !!(AI_CONFIG.apiKey && AI_CONFIG.apiKey.startsWith('sk-'))
}

function parseJSON(text) {
  if (!text) return null
  try {
    let raw = String(text).trim()
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    const match = raw.match(/\{[\s\S]*\}/)
    return JSON.parse(match ? match[0] : raw)
  } catch (e) {
    console.error('[AI] JSON 解析失败:', text)
    return null
  }
}

async function callAI(messages, options = {}) {
  if (!isAIReady()) {
    return { success: false, error: 'API Key 未配置', needConfig: true }
  }

  const payload = {
    model: options.model || AI_CONFIG.model,
    messages,
    temperature: options.temperature ?? 0.7,
    stream: false,
  }
  if (options.json) {
    payload.response_format = { type: 'json_object' }
  }

  return new Promise((resolve) => {
    wx.request({
      url: `${AI_CONFIG.baseUrl}/chat/completions`,
      method: 'POST',
      timeout: options.timeout || AI_CONFIG.timeout,
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_CONFIG.apiKey}`,
      },
      data: payload,
      success(res) {
        console.log('[AI] status:', res.statusCode)
        if (res.statusCode === 200 && res.data?.choices?.[0]?.message?.content) {
          resolve({
            success: true,
            content: res.data.choices[0].message.content,
          })
          return
        }
        const errMsg =
          res.data?.error?.message ||
          res.data?.message ||
          `请求失败 HTTP ${res.statusCode}`
        console.error('[AI] 错误:', errMsg, res.data)
        resolve({ success: false, error: errMsg })
      },
      fail(err) {
        const errMsg = err.errMsg || '网络请求失败'
        console.error('[AI] 网络错误:', errMsg)
        resolve({
          success: false,
          error: errMsg.includes('url not in domain list')
            ? '请在开发者工具关闭「校验合法域名」，或配置 request 合法域名'
            : errMsg,
        })
      },
    })
  })
}

async function callAIJson(systemPrompt, userPrompt, options = {}) {
  const system = systemPrompt.includes('JSON') || systemPrompt.includes('json')
    ? systemPrompt
    : `${systemPrompt} 你必须只返回合法 JSON，不要 markdown 代码块。`

  const res = await callAI(
    [
      { role: 'system', content: system },
      { role: 'user', content: userPrompt },
    ],
    { ...options, json: true }
  )

  if (!res.success) {
    return { success: false, error: res.error, needConfig: res.needConfig, fromAI: false }
  }

  const data = parseJSON(res.content)
  if (!data) {
    return { success: false, error: 'AI 返回内容解析失败', fromAI: false }
  }

  return { success: true, data, fromAI: true }
}

const { getAgeLabel, getAgeMonths, calcAgeMonths } = require('./foodData')

const SEASONING_JSON_GUIDE = `seasonings 数组要求（重要）：
1. 根据本餐/所选食材智能推荐 2-6 种调料，不限于盐、糖、酱油
2. 可推荐：葱、姜、蒜、植物油、儿童酱油、芝麻香油、淀粉、番茄、番茄酱、香醋、料酒、亚麻籽油、核桃油、蚝油等，须与菜品和年龄段匹配
3. 每项格式 { "name": "调料名", "amount": "具体用量，须含单位，如约2克、半勺、1茶匙、3毫升" }
4. 小月龄禁止不适宜调料；1岁+ 可少量调味但仍低盐低糖
5. 尽量给出约略克数或勺数，避免只写「适量」`

const METHODS_JSON_GUIDE = `methods 数组要求：
1. 根据所选食材与搭配方案，给出 2-4 条具体做法或烹饪步骤
2. 每条一步，简洁可执行，符合宝宝年龄段质地与安全要求
3. 格式为字符串数组，如 ["鸡胸肉切小丁蒸熟", "西兰花焯水后切碎拌入"]`

function getAgeSeasoningRules(ageId) {
  const rules = {
    '6-8': '以小月龄为主：尽量不加调料，必要时仅可用极少量植物油；禁止盐、糖、酱油、蜂蜜。',
    '8-10': '仍以原味为主，可加极少量植物油；不建议盐、糖、酱油。',
    '10-12': '可极少量盐或儿童酱油，可搭配葱姜去腥；不建议糖。',
    '1-2': '可少量盐、儿童酱油、葱姜、植物油、芝麻等，根据菜品灵活搭配，每种注明克数或勺数。',
    '2-3': '以幼儿餐为主：可少量盐、儿童酱油、葱姜、植物油等调味，口味仍宜清淡，注明具体克数或勺数。',
    '4-5': '可参考儿童餐口味，允许少量盐、酱油、番茄、香醋等调味；避免辛辣重口，注明具体用量。',
    '6-7': '接近学龄儿童，可做家庭餐简化版，少量盐和常见家常调味可用，但仍需控制油盐糖并注明具体用量。',
  }
  return rules[ageId] || rules['8-10']
}

function buildBabyContext(profile, allergies) {
  const allergyNames = (allergies || []).map((a) => a.name).join('、') || '无'
  const dislikes = (profile.dislikes || []).join('、') || '无'
  const ageId = profile.ageId || '8-10'
  // 出生日期优先：用出生日期精确推算当前月龄
  const birthMonths = profile.birthDate ? calcAgeMonths(profile.birthDate) : 0
  const ageMonths = birthMonths || profile.ageMonths || getAgeMonths(ageId)
  const ageLabel = getAgeLabel(ageId)
  const ageDesc =
    ageMonths < 12
      ? `${ageMonths}个月`
      : `${Math.floor(ageMonths / 12)}岁${ageMonths % 12 ? (ageMonths % 12) + '个月' : ''}`
  const genderText =
    profile.gender === 'boy' ? '男宝' : profile.gender === 'girl' ? '女宝' : '未设置'
  return `孩子昵称：${profile.name || '宝宝'}
宝宝性别：${genderText}
当前月龄：${ageMonths}个月（${ageDesc}），所属年龄段：${ageLabel}
过敏原：${allergyNames}
不吃的食材：${dislikes}
调味与质地要求：${getAgeSeasoningRules(ageId)}
请严格按「${ageMonths}个月」这一实际月龄来推荐食材形态、质地与用量，不要按成人或超出该月龄的标准。`
}

/** 智能搭配 */
async function smartCombine(selectedFoods, profile, allergies) {
  const names = selectedFoods.map((f) => f.name).join('、')
  const ageId = profile.ageId || '8-10'
  return callAIJson(
    '你是一位专业的中国儿童营养师，熟悉 WHO 和 AAP 辅食指南。必须根据年龄段给出热量和调料建议。',
    `${buildBabyContext(profile, allergies)}

用户勾选了这些食材：${names}

请生成搭配方案，严格按以下 JSON 格式返回：
{
  "main": "🥩 主菜名",
  "mainCalories": 180,
  "side": "🥕 配菜名",
  "sideCalories": 65,
  "fruit": "🍎 水果名",
  "fruitCalories": 50,
  "seasonings": [
    { "name": "葱", "amount": "约3克" },
    { "name": "植物油", "amount": "半茶匙，约2毫升" },
    { "name": "儿童酱油", "amount": "3滴，约0.5毫升" }
  ],
  "methods": ["鸡胸肉切小丁蒸熟", "西兰花焯水切碎", "水果切小块方便抓取"],
  "totalCalories": 295,
  "reasons": ["搭配原因1", "搭配原因2", "搭配原因3"]
}
${SEASONING_JSON_GUIDE}
${METHODS_JSON_GUIDE}
注意：seasonings 须结合用户所选食材【${names}】与【${getAgeLabel(ageId)}】年龄段智能搭配。methods 须说明主菜、配菜的具体烹饪方式。`
  )
}

/** 冰箱搭配 */
async function fridgeMatch(fridgeItems, profile, allergies) {
  const names = fridgeItems.map((f) => f.name).join('、')
  const ageId = profile.ageId || '8-10'
  return callAIJson(
    '你是一位专业的中国儿童营养师。必须标注每餐大卡及调料用量。',
    `${buildBabyContext(profile, allergies)}

冰箱里有：${names}

请帮忙搭配三餐，减少浪费，严格按以下 JSON 格式返回：
{
  "lunch": "🥩 午餐菜名",
  "lunchCalories": 350,
  "lunchSeasonings": [
    { "name": "姜", "amount": "1片，约2克" },
    { "name": "植物油", "amount": "1茶匙，约5毫升" }
  ],
  "lunchMethods": ["牛肉切薄片快炒", "蔬菜焯水后拌入"],
  "dinner": "🥬 晚餐菜名",
  "dinnerCalories": 280,
  "dinnerSeasonings": [{ "name": "葱", "amount": "约2克" }],
  "dinnerMethods": ["清蒸后捣成泥"],
  "tomorrowBreakfast": "🥚 早餐菜名",
  "breakfastCalories": 200,
  "breakfastSeasonings": [{ "name": "亚麻籽油", "amount": "3滴，约0.5毫升" }],
  "breakfastMethods": ["鸡蛋打散蒸成嫩蛋羹"],
  "tips": "一句温馨提示"
}
${SEASONING_JSON_GUIDE}
${METHODS_JSON_GUIDE}
注意：每餐 seasonings 须结合该餐菜名与冰箱食材【${names}】、年龄段【${getAgeLabel(ageId)}】智能搭配；每餐 methods 对应该餐菜品做法。`
  )
}

/** 一周菜单 */
async function weeklyMenu(profile, allergies, fridgeItems) {
  const fridge = (fridgeItems || []).map((f) => f.name).join('、') || '不限'
  return callAIJson(
    '你是一位专业的中国儿童营养师。生成符合中国家庭的一周辅食菜单，低盐低糖。',
    `${buildBabyContext(profile, allergies)}

冰箱现有食材：${fridge}

请生成一周菜单（周一至周日），每天早餐、午餐、晚餐。每餐可含 1-3 道菜，每道菜单独列出配料明细，严格按以下 JSON 格式返回：
{
  "days": [
    {
      "day": "周一",
      "breakfast": [
        { "name": "牛奶燕麦糊", "details": ["燕麦片20g", "配方奶150ml"] },
        { "name": "香蕉半根", "details": ["约50g"] }
      ],
      "lunch": [
        { "name": "番茄牛肉碎碎面", "details": ["面条30g", "牛肉20g", "番茄50g", "植物油2g"] },
        { "name": "清蒸西兰花", "details": ["西兰花30g"] }
      ],
      "dinner": [
        { "name": "鸡肉蔬菜粥", "details": ["大米20g", "鸡肉15g", "胡萝卜20g"] }
      ]
    }
  ],
  "nutrition": ["营养亮点1", "营养亮点2", "营养亮点3"],
  "nutritionAnalysis": {
    "categoryShare": [
      { "label": "蔬菜", "value": 32, "color": "#5ECFB8" },
      { "label": "肉类", "value": 24, "color": "#FF8FAB" },
      { "label": "主食", "value": 18, "color": "#FFB088" },
      { "label": "蛋奶豆", "value": 16, "color": "#FFD93D" },
      { "label": "水果", "value": 10, "color": "#B8E986" }
    ],
    "dailyTrend": [
      { "day": "周一", "protein": 82, "fiber": 75, "balance": 80 },
      { "day": "周二", "protein": 85, "fiber": 78, "balance": 83 },
      { "day": "周三", "protein": 80, "fiber": 82, "balance": 81 },
      { "day": "周四", "protein": 88, "fiber": 76, "balance": 85 },
      { "day": "周五", "protein": 84, "fiber": 80, "balance": 82 },
      { "day": "周六", "protein": 86, "fiber": 77, "balance": 84 },
      { "day": "周日", "protein": 83, "fiber": 79, "balance": 83 }
    ]
  },
  "shoppingList": {
    "肉类": ["牛肉", "鸡胸肉"],
    "蔬菜": ["西兰花", "胡萝卜"],
    "主食": ["大米", "面条"],
    "蛋奶豆": ["鸡蛋"],
    "水果": ["苹果", "香蕉"],
    "调料": ["儿童酱油", "植物油"],
    "其他": []
  }
}

每餐 breakfast/lunch/dinner 必须是数组；每项 { "name": "菜名", "details": ["用量1", "用量2"] }。不要把多道菜挤在一个字符串里。
nutritionAnalysis 须根据本周菜单估算：categoryShare 为食材分类占比（value 为百分比整数，合计约100）；dailyTrend 为周一至周日每天的 protein（蛋白质）、fiber（膳食纤维）、balance（均衡度）评分（55-98 的整数）。
采购清单须按分类填写 shoppingList，键名固定为：肉类、蔬菜、主食、蛋奶豆、水果、调料、其他。每类填入该周需采购的食材名称，无则返回空数组 []。`,
    { timeout: 120000 }
  )
}

/** 今日一句建议（头部展示） */
async function todaySuggestion(profile, allergies) {
  const ageId = profile.ageId || '8-10'
  return callAIJson(
    '你是一位亲切的中国儿童营养师。根据宝宝年龄和性别，给家长一句轻松温馨的今日食材建议。',
    `${buildBabyContext(profile, allergies)}

请为【${getAgeLabel(ageId)}】宝宝生成「今日一句建议」，推荐一种适合今天尝试的食材（须符合该月龄质地与安全要求，避开过敏原和不吃的食材）。

句式二选一（随机选用即可）：
A. leadText 为「今天推荐」，actionText 为「尝试」，再给出 emoji 和 food
B. leadText 为「今天试试」，actionText 留空字符串，再给出 emoji 和 food

严格按以下 JSON 格式返回（只返回一种句式）：
{
  "leadText": "今天推荐",
  "actionText": "尝试",
  "emoji": "🫑",
  "food": "青椒"
}
或
{
  "leadText": "今天试试",
  "actionText": "",
  "emoji": "🐟",
  "food": "三文鱼"
}

注意：food 用 2-6 字食材名；emoji 与食材匹配；小月龄优先泥糊状安全食材。`
  )
}

/** 今日推荐 */
async function todayRecommend(profile, allergies) {
  const ageId = profile.ageId || '8-10'
  return callAIJson(
    '你是一位专业的中国儿童营养师。必须根据「当前年龄段」推荐食材形态和调料，严格遵循调味与质地要求。',
    `${buildBabyContext(profile, allergies)}

请为【${getAgeLabel(ageId)}】宝宝推荐今天的一餐（恰好4种食材），食材名称和形态必须符合该月龄（如小月龄用泥/糊，1岁+可用块状）。
家长更关心推荐用量与营养特点，不要返回卡路里或评分星级。
尽量避免总是重复「牛肉、西兰花、胡萝卜」这类常见组合；可在鱼类、鸡肉、蛋类、豆腐、南瓜、番茄、玉米、菠菜、山药、红薯、菌菇等食材中灵活变化。
严格按以下 JSON 格式返回：
{
  "foods": [
    {
      "emoji": "🐟",
      "name": "鳕鱼泥",
      "amount": "25g",
      "tags": [
        { "emoji": "🐟", "label": "优质蛋白" },
        { "emoji": "🧠", "label": "DHA" }
      ]
    }
  ],
  "nutritionRings": [
    { "label": "蛋白质", "percent": 90 },
    { "label": "维C", "percent": 85 },
    { "label": "铁", "percent": 95 }
  ],
  "seasonings": [
    { "name": "植物油", "amount": "半茶匙，约2毫升" },
    { "name": "姜", "amount": "1小片，去腥后取出" }
  ],
  "methods": [
    "鳕鱼蒸熟后去刺压碎备用",
    "南瓜和土豆蒸软压成泥",
    "将鳕鱼泥拌入南瓜土豆泥中，滴少量植物油后放温食用"
  ],
  "cookTimeText": "约15分钟",
  "priceText": "约18元",
  "tip": "一句温馨小贴士"
}
${SEASONING_JSON_GUIDE}
补充要求：
- methods 返回 2-4 条具体做法，能让家长看完就知道是蒸、煮、炖还是焖，步骤简洁清楚
- cookTimeText 返回这顿辅食从准备到完成的大致耗时，如「约12分钟」「约20分钟」
- priceText 返回本餐主要食材的大致成本，如「约12元」「约18元」
注意：seasonings 须结合本餐推荐食材与【${getAgeLabel(ageId)}】年龄段智能搭配，不限于盐糖酱油。`
  )
}

/** 随机一天菜单 */
async function randomDayMenu(profile, allergies) {
  return callAIJson(
    '你是一位专业的中国儿童营养师。每餐需标注推荐克重、营养特点和调料用量。',
    `${buildBabyContext(profile, allergies)}

请随机生成一天的完整菜单，严格按以下 JSON 格式返回：
{
  "breakfast": {
    "foods": [
      {
        "emoji": "🥚",
        "name": "鸡蛋",
        "amount": "25g",
        "tags": [
          { "emoji": "🥩", "label": "高蛋白" },
          { "emoji": "🦴", "label": "高钙" }
        ]
      }
    ],
    "seasonings": [
      { "name": "亚麻籽油", "amount": "3滴，约0.5毫升" }
    ],
    "mealTags": [
      { "emoji": "🥩", "label": "高蛋白" },
      { "emoji": "🦴", "label": "高钙" }
    ]
  },
  "lunch": {
    "foods": [
      {
        "emoji": "🥩",
        "name": "牛肉",
        "amount": "30g",
        "tags": [
          { "emoji": "🥩", "label": "高蛋白" },
          { "emoji": "🩸", "label": "富铁" }
        ]
      }
    ],
    "seasonings": [
      { "name": "姜", "amount": "1片，约2克" },
      { "name": "儿童酱油", "amount": "半勺，约3毫升" }
    ],
    "mealTags": [
      { "emoji": "🥩", "label": "高蛋白" },
      { "emoji": "🩸", "label": "富铁" }
    ]
  },
  "dinner": { "foods": [], "seasonings": [], "mealTags": [] },
  "snack": { "foods": [], "seasonings": [], "mealTags": [] }
}
${SEASONING_JSON_GUIDE}
注意：
- 每餐 foods 里的每种食材都要给出 amount（推荐克重）和 tags（1-2个营养特点）
- mealTags 为本餐整体营养亮点，返回 1-3 个
- 不要返回大卡、热量、卡路里、评分星级
- 每餐 seasonings 须结合该餐 foods 中的食材与宝宝年龄段智能搭配。`
  )
}

/** 能不能吃 */
async function canEatQuery(foodName, profile, allergies) {
  const ageId = profile.ageId || '8-10'
  const name = String(foodName || '').trim()
  return callAIJson(
    '你是一位专业的中国儿童营养师，熟悉 WHO 和 AAP 辅食指南。必须根据宝宝年龄段给出能不能吃、搭配建议、调料和做法。',
    `${buildBabyContext(profile, allergies)}

家长查询食材：【${name}】
请判断【${getAgeLabel(ageId)}】宝宝能不能吃，并给出搭配与做法建议，严格按以下 JSON 格式返回：
{
  "found": true,
  "emoji": "🦐",
  "name": "食材名称",
  "can": true,
  "note": "一句话结论，说明原因",
  "whoAdvice": "引用 WHO 婴幼儿喂养/辅食指南的1-2句话，说明该月龄能否吃",
  "aapAdvice": "引用 AAP 儿童饮食安全/辅食添加建议的1-2句话，说明注意事项",
  "pairings": ["西兰花", "胡萝卜", "软米饭"],
  "seasonings": [
    { "name": "姜", "amount": "1片，约2克" },
    { "name": "植物油", "amount": "半茶匙，约2毫升" }
  ],
  "methods": ["清蒸后剁碎拌粥", "虾仁蔬菜软饭"],
  "avoid": ["不建议事项1", "不建议事项2"]
}

字段说明：
- can 取值：true=可以吃，false=不建议，"caution"=谨慎尝试、需观察过敏
- whoAdvice：结合 WHO 指南，针对该食材与月龄给出权威建议（中文，家长易懂）
- aapAdvice：结合 AAP 指南，针对该食材与月龄给出权威建议（中文，家长易懂）
- pairings：推荐与【${name}】搭配的 2-5 种食材名称，须符合该年龄段
- seasonings：根据【${name}】和年龄段推荐 1-4 种调料，注明克数或勺数，不限于盐糖酱油
- methods：推荐 2-4 种具体做法或吃法，步骤简洁可执行
- avoid 为字符串数组，无内容时返回 []
${SEASONING_JSON_GUIDE}
- 若食材名称不明确或无法判断，设 found 为 false，并给出 message 字段说明`
  )
}

/** 辅食排敏 — 过敏症状查询 */
async function allergySymptomsQuery(foodName, profile) {
  const name = String(foodName || '').trim()
  if (!name) {
    return { success: false, error: '食材名称不能为空', fromAI: false }
  }
  return callAIJson(
    '你是一位专业的中国儿科过敏与儿童营养师，熟悉婴幼儿食物过敏常见表现。请根据食材给出宝宝过敏时可能出现的症状，语气温和、实用，面向家长。',
    `${buildBabyContext(profile, [])}

家长想了解食材【${name}】引起宝宝食物过敏时，常见会有哪些症状表现。
请严格按以下 JSON 格式返回：
{
  "found": true,
  "emoji": "🥚",
  "name": "${name}",
  "summary": "一句话概括该食材过敏风险与常见表现",
  "symptomGroups": [
    {
      "icon": "🧴",
      "title": "皮肤症状",
      "items": ["湿疹加重", "荨麻疹", "面部或嘴唇红肿"]
    },
    {
      "icon": "🤢",
      "title": "消化症状",
      "items": ["呕吐", "腹泻", "腹痛哭闹"]
    },
    {
      "icon": "😮‍💨",
      "title": "呼吸症状",
      "items": ["咳嗽", "喘息", "声音嘶哑"]
    }
  ],
  "severeSigns": ["呼吸困难", "嘴唇或舌头肿胀", "精神萎靡"],
  "observeTips": ["首次添加少量观察", "连续观察3-5天", "出现症状立即停止并记录"],
  "whenToDoctor": "若出现呼吸困难、持续呕吐、精神差等，请立即就医"
}

要求：
- symptomGroups 返回 2-4 组，每组 2-5 条具体症状，贴合【${name}】与婴幼儿
- severeSigns 列出需紧急就医的严重信号 2-4 条
- observeTips 给出排敏观察建议 2-4 条
- 若食材名称不明确，设 found 为 false 并给出 message`
  )
}

/** 能不能吃 — 热门查询推荐 */
async function canEatHotTags(profile, allergies) {
  const ageId = profile.ageId || '8-10'
  return callAIJson(
    '你是一位专业的中国儿童营养师，熟悉 WHO 和 AAP 辅食指南。根据宝宝月龄推荐家长常搜的食材。',
    `${buildBabyContext(profile, allergies)}

请为【${getAgeLabel(ageId)}】宝宝家长推荐 6-8 个「能不能吃」热门查询食材。
要求：
- 涵盖肉类、蔬菜、水果、海鲜、蛋奶等不同类型，标注 type
- 避开过敏原和不吃的食材
- 选该月龄家长真正常关心的食材名，name 用 2-4 字简称

严格按以下 JSON 格式返回：
{
  "items": [
    { "name": "虾", "emoji": "🦐", "type": "海鲜" },
    { "name": "芒果", "emoji": "🥭", "type": "水果" },
    { "name": "鸡蛋", "emoji": "🥚", "type": "蛋奶" }
  ]
}`
  )
}

module.exports = {
  AI_CONFIG,
  setAIConfig,
  isAIReady,
  callAI,
  smartCombine,
  fridgeMatch,
  weeklyMenu,
  todaySuggestion,
  todayRecommend,
  randomDayMenu,
  canEatQuery,
  canEatHotTags,
  allergySymptomsQuery,
}
