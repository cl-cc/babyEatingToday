const { AGE_GROUPS, getAgeMonths } = require('../../utils/foodData')
const { getCanEatResult } = require('../../utils/canEatData')
const { getProfile, getAllergies, getProfileReady } = require('../../utils/storage')
const { canEatQuery, canEatHotTags, isAIReady } = require('../../utils/ai')
const { normalizeCanEatResult } = require('../../utils/nutritionHelper')

const { getCanEatHot, setCanEatHot, getCanEatQuery, setCanEatQuery } = require('../../utils/aiCache')

const DEFAULT_HOT = [
  { name: '虾', emoji: '🦐', type: '海鲜' },
  { name: '蜂蜜', emoji: '🍯', type: '调味' },
  { name: '鸡蛋', emoji: '🥚', type: '蛋奶' },
  { name: '牛奶', emoji: '🥛', type: '蛋奶' },
  { name: '坚果', emoji: '🥜', type: '其他' },
  { name: '芒果', emoji: '🥭', type: '水果' },
]

function normalizeHotList(items) {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => {
      if (typeof item === 'string') {
        return { name: item.trim(), emoji: '🥗', type: '' }
      }
      return {
        name: String(item.name || '').trim(),
        emoji: item.emoji || '🥗',
        type: item.type || '',
      }
    })
    .filter((item) => item.name)
    .slice(0, 8)
}

Component({
  data: {
    query: '',
    ageGroups: AGE_GROUPS,
    ageLabels: AGE_GROUPS.map((a) => a.label),
    ageIndex: 1,
    selectedAge: '8-10',
    hotList: DEFAULT_HOT,
    hotLoading: false,
    loading: false,
    result: null,
  },

  lifetimes: {
    attached() {
      this.bootstrapPage()
    },
  },

  methods: {
    async bootstrapPage() {
      await getProfileReady()
      const profile = getProfile()
      const ageId = profile.ageId || '8-10'
      const ageIndex = AGE_GROUPS.findIndex((a) => a.id === ageId)
      this.setData({
        selectedAge: ageId,
        ageIndex: ageIndex >= 0 ? ageIndex : 1,
      })
      const tabBar = this.getTabBar()
      if (tabBar) tabBar.setSelected(2)
      this.loadHotTags(ageId)
    },

    getTabBar() {
      return this.selectComponent('#tabBar')
    },

    loadHotTags(ageId) {
      const cached = getCanEatHot(ageId)
      if (cached && cached.length) {
        this.setData({ hotList: cached })
        return
      }

      this.setData({ hotList: DEFAULT_HOT, hotLoading: true })

      if (!isAIReady()) {
        this.setData({ hotLoading: false })
        return
      }

      const profile = getProfile()
      const allergies = getAllergies()
      const profileWithAge = Object.assign({}, profile, {
        ageId,
        ageMonths: getAgeMonths(ageId),
      })

      canEatHotTags(profileWithAge, allergies).then((res) => {
        if (this.data.selectedAge !== ageId) return

        const list = normalizeHotList(res.success && res.data ? res.data.items : [])
        if (list.length) {
          setCanEatHot(ageId, list)
          this.setData({ hotList: list, hotLoading: false })
        } else {
          this.setData({ hotLoading: false })
        }
      })
    },

    onInput(e) {
      this.setData({ query: e.detail.value })
    },

    onAgeChange(e) {
      const idx = Number(e.detail.value)
      const ageId = AGE_GROUPS[idx].id
      this.setData({
        ageIndex: idx,
        selectedAge: ageId,
        result: null,
      })
      this.loadHotTags(ageId)
    },

    onHotTap(e) {
      const q = e.currentTarget.dataset.q
      this.setData({ query: q })
      this.doSearch(q)
    },

    onSearch() {
      this.doSearch(this.data.query)
    },

    onShowRefTip() {
      wx.showModal({
        title: '参考来源说明',
        content:
          'WHO（世界卫生组织 World Health Organization）\n全球公共卫生权威机构，发布婴幼儿喂养、辅食添加与营养指南。\n\nAAP（美国儿科学会 American Academy of Pediatrics）\n美国权威儿科医学组织，提供儿童饮食安全与辅食添加建议。',
        showCancel: false,
        confirmText: '知道了',
      })
    },

    doSearch(query) {
      const q = (query || '').trim()
      if (!q) {
        wx.showToast({ title: '请输入食材名称', icon: 'none' })
        return
      }
      if (this.data.loading) return

      this.setData({ loading: true, result: null }, () => {
        this.fetchResult(q)
      })
    },

    async fetchResult(q) {
      const profile = getProfile()
      const ageId = this.data.selectedAge
      const allergies = getAllergies()

      const cachedResult = getCanEatQuery(ageId, q)
      if (cachedResult) {
        this.setData({
          result: normalizeCanEatResult(cachedResult, q, ageId),
          loading: false,
        })
        return
      }

      const profileWithAge = Object.assign({}, profile, {
        ageId,
        ageMonths: getAgeMonths(ageId),
      })

      if (isAIReady()) {
        const res = await canEatQuery(q, profileWithAge, allergies)
        if (res.success && res.data) {
          const result = normalizeCanEatResult(res.data, q, ageId)
          setCanEatQuery(ageId, q, result)
          this.setData({
            result,
            loading: false,
          })
          return
        }
      }

      const result = normalizeCanEatResult(getCanEatResult(q, ageId), q, ageId)
      setCanEatQuery(ageId, q, result)
      this.setData({ result, loading: false })

      if (!isAIReady()) {
        wx.showToast({ title: '已使用本地参考数据', icon: 'none', duration: 2000 })
      }
    },
  },
})
