const { AGE_GROUPS, getAgeMonths } = require('../../utils/foodData')
const { getCanEatResult } = require('../../utils/canEatData')
const { getProfile, getAllergies, getProfileReady } = require('../../utils/storage')
const { canEatQuery, canEatHotTags, isAIReady, isAIQuotaExceeded, showAIQuotaTip } = require('../../utils/ai')
const { normalizeCanEatResult } = require('../../utils/nutritionHelper')
const echarts = require('../../components/ec-canvas/echarts')

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

function buildFeedingChartMetrics(result) {
  if (!result || !result.found) return null

  const verdictScore =
    result.can === true ? 92 : result.can === false ? 28 : 62
  const pairingScore = Math.min(96, 36 + result.pairings.length * 13)
  const methodScore = Math.min(92, 42 + result.methods.length * 12)
  const seasoningScore = result.seasonings.length
    ? Math.max(38, 78 - result.seasonings.length * 8)
    : 86
  const avoidPenalty = Math.min(42, result.avoid.length * 12)
  const safetyScore = Math.max(22, verdictScore - avoidPenalty)

  return [
    { name: '适龄友好', value: verdictScore, fullMark: 100 },
    { name: '搭配丰富', value: pairingScore, fullMark: 100 },
    { name: '烹饪可行', value: methodScore, fullMark: 100 },
    { name: '调味负担', value: seasoningScore, fullMark: 100 },
    { name: '安全提醒', value: safetyScore, fullMark: 100 },
  ]
}

function buildCanEatRadarOption(result) {
  const metrics = buildFeedingChartMetrics(result) || []
  return {
    color: ['#FF7FA6'],
    radar: {
      center: ['50%', '54%'],
      radius: '62%',
      splitNumber: 4,
      axisName: {
        color: '#8C7284',
        fontSize: 11,
      },
      splitLine: {
        lineStyle: {
          color: ['#FFE8F0', '#FFE1EC', '#FFD7E6', '#FFCDDFFF'],
        },
      },
      splitArea: {
        areaStyle: {
          color: ['#FFFDFE', '#FFF8FB'],
        },
      },
      axisLine: {
        lineStyle: {
          color: '#F5CCDB',
        },
      },
      indicator: metrics.map((item) => ({
        name: item.name,
        max: item.fullMark,
      })),
    },
    series: [
      {
        type: 'radar',
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: {
          color: '#FF6B8A',
        },
        lineStyle: {
          width: 2,
          color: '#FF7FA6',
        },
        areaStyle: {
          color: 'rgba(255, 127, 166, 0.26)',
        },
        data: [
          {
            value: metrics.map((item) => item.value),
            name: result.name || '当前食材',
          },
        ],
      },
    ],
  }
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
    ecRadar: { lazyLoad: true },
  },

  lifetimes: {
    attached() {
      this.bootstrapPage()
    },
    detached() {
      this.disposeCharts()
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

    disposeCharts() {
      if (this.radarChart) {
        try {
          this.radarChart.clear()
        } catch (err) {
          console.warn('[can-eat] clear chart fail:', err)
        }
        this.radarChart = null
      }
    },

    initCharts() {
      const result = this.data.result
      if (!result || !result.found) return

      const radarComp = this.selectComponent('#can-eat-radar')
      if (!radarComp) return

      if (!this.radarChart) {
        radarComp.init((canvas, width, height, dpr) => {
          if (!width || !height) return null
          const chart = echarts.init(canvas, null, {
            width,
            height,
            devicePixelRatio: dpr,
          })
          canvas.setChart(chart)
          this.radarChart = chart
          chart.setOption(buildCanEatRadarOption(result), true)
          return chart
        })
      } else {
        this.radarChart.setOption(buildCanEatRadarOption(result), true)
      }
    },

    scheduleChartInit(retry = 0) {
      wx.nextTick(() => {
        setTimeout(() => {
          const radarComp = this.selectComponent('#can-eat-radar')
          if (!radarComp && retry < 6) {
            this.scheduleChartInit(retry + 1)
            return
          }
          this.initCharts()
        }, 120)
      })
    },

    applyResult(result) {
      this.disposeCharts()
      this.setData({ result, loading: false }, () => {
        if (result && result.found) {
          this.scheduleChartInit()
        }
      })
    },

    loadHotTags(ageId) {
      const cached = getCanEatHot(ageId)
      if (cached && cached.length) {
        this.setData({ hotList: cached })
        return
      }

      this.setData({ hotList: DEFAULT_HOT, hotLoading: true })

      if (!isAIReady() || isAIQuotaExceeded()) {
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

      const cachedResult = getCanEatQuery(this.data.selectedAge, q)
      if (cachedResult) {
        this.applyResult(normalizeCanEatResult(cachedResult, q, this.data.selectedAge))
        return
      }

      if (isAIQuotaExceeded()) {
        showAIQuotaTip()
        return
      }

      this.disposeCharts()
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
        this.applyResult(normalizeCanEatResult(cachedResult, q, ageId))
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
          this.applyResult(result)
          return
        }
        if (res.quotaExceeded) {
          const result = normalizeCanEatResult(getCanEatResult(q, ageId), q, ageId)
          this.applyResult(result)
          return
        }
      }

      const result = normalizeCanEatResult(getCanEatResult(q, ageId), q, ageId)
      setCanEatQuery(ageId, q, result)
      this.applyResult(result)

      if (!isAIReady()) {
        wx.showToast({ title: '已使用本地参考数据', icon: 'none', duration: 2000 })
      }
    },
  },
})
