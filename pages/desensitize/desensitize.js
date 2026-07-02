const { CATEGORIES, listFoods, findFood } = require('../../utils/desensitizeFoods')
const {
  getAllergyNames,
  getEatenNames,
  setFoodAllergy,
  setFoodEaten,
  isEaten,
  getProfileReady,
  getProfile,
} = require('../../utils/storage')
const { allergySymptomsQuery, isAIReady } = require('../../utils/ai')

const FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'allergic', label: '过敏' },
  { id: 'eaten', label: '已吃的' },
  { id: 'uneaten', label: '未吃的' },
]

const EMPTY_TIPS = {
  all: '该分类暂无食材',
  allergic: '暂无过敏食材',
  eaten: '暂无已吃食材',
  uneaten: '该分类已全部吃过',
}

const CATEGORY_EMOJIS = {
  grain: '🍚',
  veg: '🥬',
  fruit: '🍇',
  meat: '🥩',
  seafood: '🦐',
  egg_dairy: '🥚',
  bean: '🫘',
}

const GROUP_COLORS = ['#FF8FAB', '#FFB088', '#5ECFB8', '#B8E986', '#D4B8E8']

const RISK_LABELS = {
  low: '一般关注',
  medium: '中度关注',
  high: '高度关注',
}

function normalizeSymptomResult(data, food) {
  const groups = (Array.isArray(data.symptomGroups) ? data.symptomGroups : []).map((group, index) => {
    const items = Array.isArray(group.items)
      ? group.items.map((item) => String(item).trim()).filter(Boolean)
      : []
    return {
      icon: group.icon || '🩺',
      title: String(group.title || group.name || '其他症状').trim(),
      items,
      count: items.length,
    }
  }).filter((group) => group.title)

  const severeSigns = (Array.isArray(data.severeSigns) ? data.severeSigns : [])
    .map((item) => String(item).trim())
    .filter(Boolean)
  const observeTips = (Array.isArray(data.observeTips) ? data.observeTips : [])
    .map((item) => String(item).trim())
    .filter(Boolean)

  const maxCount = Math.max(...groups.map((group) => group.count), 1)
  const visualGroups = groups.map((group, index) => ({
    ...group,
    color: GROUP_COLORS[index % GROUP_COLORS.length],
    percent: Math.max(12, Math.round((group.count / maxCount) * 100)),
  }))

  const totalSymptoms = groups.reduce((sum, group) => sum + group.count, 0)
  const severeCount = severeSigns.length
  let riskLevel = 'low'
  if (severeCount >= 3 || totalSymptoms >= 10) riskLevel = 'high'
  else if (severeCount >= 1 || totalSymptoms >= 5) riskLevel = 'medium'

  return {
    emoji: data.emoji || food.emoji,
    name: data.name || food.name,
    summary: data.summary || '以下为常见过敏表现，供排敏观察参考',
    symptomGroups: groups,
    visualGroups,
    severeSigns,
    observeTips,
    whenToDoctor: data.whenToDoctor || '若出现呼吸困难、持续呕吐或精神差，请立即就医',
    totalSymptoms,
    groupCount: groups.length,
    severeCount,
    riskLevel,
    riskLabel: RISK_LABELS[riskLevel],
  }
}

Component({
  data: {
    categories: CATEGORIES,
    filters: FILTERS,
    activeCat: 'grain',
    activeFilter: 'all',
    summaryCards: [],
    foods: [],
    emptyTip: '',
    allergyCount: 0,
    eatenCount: 0,
    sheetVisible: false,
    sheetFood: null,
    sheetSymptomOpen: false,
    sheetSymptomLoading: false,
    sheetSymptomResult: null,
    sheetSymptomError: '',
  },

  lifetimes: {
    attached() {
      this.bootstrapPage()
    },
  },

  pageLifetimes: {
    show() {
      this.refreshFromCloud()
    },
  },

  methods: {
    async bootstrapPage() {
      await getProfileReady()
      this.getTabBar()?.setSelected(3)
      this.refreshFoods()
    },

    async refreshFromCloud() {
      await getProfileReady()
      this.refreshFoods()
    },

    getTabBar() {
      return this.selectComponent('#tabBar')
    },

    resetSheetSymptom() {
      this._symptomQueryId = 0
      this.setData({
        sheetSymptomOpen: false,
        sheetSymptomLoading: false,
        sheetSymptomResult: null,
        sheetSymptomError: '',
      })
    },

    refreshFoods() {
      const allergyNames = getAllergyNames()
      const eatenNames = getEatenNames()
      const foods = listFoods(
        this.data.activeCat,
        this.data.activeFilter,
        allergyNames,
        eatenNames
      )
      this.setData({
        summaryCards: this.data.categories.map((category) => {
          const count = eatenNames.filter((name) => {
            const food = findFood(name)
            return food && food.categoryId === category.id
          }).length
          return {
            id: category.id,
            name: category.name,
            emoji: CATEGORY_EMOJIS[category.id] || '🥗',
            eatenCount: count,
          }
        }),
        foods,
        emptyTip: EMPTY_TIPS[this.data.activeFilter] || '',
        allergyCount: allergyNames.length,
        eatenCount: eatenNames.length,
      })
    },

    onCategory(e) {
      const id = e.currentTarget.dataset.id
      if (id === this.data.activeCat) return
      this.setData({ activeCat: id })
      this.refreshFoods()
    },

    onFilter(e) {
      const id = e.currentTarget.dataset.id
      if (id === this.data.activeFilter) return
      this.setData({ activeFilter: id })
      this.refreshFoods()
    },

    onFoodTap(e) {
      const name = e.currentTarget.dataset.name
      const food = findFood(name)
      if (!food) return
      this._symptomQueryId = 0
      this.setData({
        sheetVisible: true,
        sheetFood: Object.assign({}, food, {
          allergic: getAllergyNames().includes(name),
          eaten: isEaten(name),
        }),
        sheetSymptomOpen: false,
        sheetSymptomLoading: false,
        sheetSymptomResult: null,
        sheetSymptomError: '',
      })
    },

    closeSheet() {
      this.resetSheetSymptom()
      this.setData({ sheetVisible: false, sheetFood: null })
    },

    async onSheetAiSymptom() {
      const food = this.data.sheetFood
      if (!food || this.data.sheetSymptomLoading) return

      if (!isAIReady()) {
        wx.showToast({ title: '请先配置 API Key', icon: 'none' })
        return
      }

      const queryId = Date.now()
      this._symptomQueryId = queryId

      this.setData({
        sheetSymptomOpen: true,
        sheetSymptomLoading: true,
        sheetSymptomResult: null,
        sheetSymptomError: '',
      })

      try {
        await getProfileReady()
        const profile = getProfile()
        const res = await allergySymptomsQuery(food.name, profile)

        if (this._symptomQueryId !== queryId) return

        if (!res.success) {
          this.setData({
            sheetSymptomLoading: false,
            sheetSymptomError: res.error || '查询失败，请稍后重试',
          })
          return
        }

        const data = res.data || {}
        const normalized = normalizeSymptomResult(data, food)
        const hasContent =
          normalized.summary ||
          normalized.symptomGroups.length ||
          normalized.severeSigns.length

        if (data.found === false || !hasContent) {
          this.setData({
            sheetSymptomLoading: false,
            sheetSymptomError: data.message || '暂未查询到该食材的过敏信息',
          })
          return
        }

        this.setData({
          sheetSymptomLoading: false,
          sheetSymptomResult: normalized,
        })
      } catch (err) {
        if (this._symptomQueryId !== queryId) return
        console.error('[desensitize] allergy query fail:', err)
        this.setData({
          sheetSymptomLoading: false,
          sheetSymptomError: '查询异常，请稍后重试',
        })
      }
    },

    noop() {},

    onAllergySwitch(e) {
      const allergic = e.detail.value
      const food = this.data.sheetFood
      if (!food) return
      setFoodAllergy(food, allergic)
      this.setData({ 'sheetFood.allergic': allergic })
      this.refreshFoods()
      wx.showToast({
        title: allergic ? '已标记过敏' : '已取消过敏',
        icon: 'none',
      })
    },

    onEatenSwitch(e) {
      const eaten = e.detail.value
      const food = this.data.sheetFood
      if (!food) return
      setFoodEaten(food, eaten)
      this.setData({ 'sheetFood.eaten': eaten })
      this.refreshFoods()
      wx.showToast({
        title: eaten ? '已标记吃过' : '已取消吃过',
        icon: 'none',
      })
    },
  },
})
