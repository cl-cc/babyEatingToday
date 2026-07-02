const { getProfile, getAllergies, getFridge, getProfileReady } = require('../../utils/storage')
const { normalizeWeeklyMenu } = require('../../utils/weeklyHelper')
const { weeklyMenu, isAIReady } = require('../../utils/ai')
const { getWeeklyMenu, setWeeklyMenu } = require('../../utils/aiCache')
const {
  renderWeeklyPoster,
  ensureAlbumPermission,
  saveImageToAlbum,
} = require('../../utils/weeklyExport')
const { buildPieOption, buildBarOption } = require('../../utils/weeklyChartOptions')
const echarts = require('../../components/ec-canvas/echarts')

Component({
  data: {
    profile: {},
    allergyText: '',
    fridgeText: '',
    loading: false,
    exporting: false,
    showExportCanvas: false,
    menu: null,
    ecPie: { lazyLoad: true },
    ecBar: { lazyLoad: true },
  },

  lifetimes: {
    attached() {
      this.loadInfo()
      this.restoreMenu()
      const tabBar = this.getTabBar()
      if (tabBar) tabBar.setSelected(4)
    },
    detached() {
      this.disposeCharts()
    },
  },

  pageLifetimes: {
    show() {
      this.loadInfo()
      this.restoreMenu()
    },
  },

  methods: {
    getTabBar() {
      return this.selectComponent('#tabBar')
    },

    async loadInfo() {
      await getProfileReady()
      const profile = getProfile()
      const allergies = getAllergies()
      const fridge = getFridge()
      this.setData({
        profile,
        allergyText: allergies.map((a) => a.name).join('、'),
        fridgeText: fridge.map((f) => f.name).join('、'),
      })
    },

    restoreMenu() {
      const profile = getProfile()
      const ageId = profile.ageId || '8-10'
      const cached = getWeeklyMenu(ageId)
      if (cached) {
        this.applyMenu(normalizeWeeklyMenu(cached))
      }
    },

    disposeCharts() {
      if (this.pieChart) {
        try {
          this.pieChart.clear()
        } catch (err) {
          console.warn('[weekly] clear pie fail:', err)
        }
        this.pieChart = null
      }
      if (this.barChart) {
        try {
          this.barChart.clear()
        } catch (err) {
          console.warn('[weekly] clear bar fail:', err)
        }
        this.barChart = null
      }
    },

    initCharts() {
      const analysis = this.data.menu && this.data.menu.nutritionAnalysis
      if (!analysis) return

      const pieComp = this.selectComponent('#weekly-pie')
      const barComp = this.selectComponent('#weekly-bar')
      if (!pieComp || !barComp) {
        console.warn('[weekly] ec-canvas 未找到，稍后重试')
        return
      }

      if (!this.pieChart) {
        pieComp.init((canvas, width, height, dpr) => {
          if (!width || !height) return null
          const chart = echarts.init(canvas, null, {
            width,
            height,
            devicePixelRatio: dpr,
          })
          canvas.setChart(chart)
          this.pieChart = chart
          chart.setOption(buildPieOption(analysis.categoryShare), true)
          return chart
        })
      } else {
        this.pieChart.setOption(buildPieOption(analysis.categoryShare), true)
      }

      if (!this.barChart) {
        barComp.init((canvas, width, height, dpr) => {
          if (!width || !height) return null
          const chart = echarts.init(canvas, null, {
            width,
            height,
            devicePixelRatio: dpr,
          })
          canvas.setChart(chart)
          this.barChart = chart
          chart.setOption(buildBarOption(analysis.dailyTrend, analysis.lineSeries), true)
          return chart
        })
      } else {
        this.barChart.setOption(buildBarOption(analysis.dailyTrend, analysis.lineSeries), true)
      }
    },

    scheduleChartInit(retry = 0) {
      wx.nextTick(() => {
        setTimeout(() => {
          const pieComp = this.selectComponent('#weekly-pie')
          const barComp = this.selectComponent('#weekly-bar')
          if ((!pieComp || !barComp) && retry < 6) {
            this.scheduleChartInit(retry + 1)
            return
          }
          this.initCharts()
        }, 120)
      })
    },

    applyMenu(menu) {
      this.disposeCharts()
      this.setData({ menu }, () => {
        if (menu && menu.nutritionAnalysis) {
          this.scheduleChartInit()
        }
      })
    },

    async onGenerate() {
      if (!isAIReady()) {
        wx.showToast({ title: '请先配置 API Key', icon: 'none' })
        return
      }

      const profile = getProfile()
      const allergies = getAllergies()
      const fridge = getFridge()

      this.disposeCharts()
      this.setData({ loading: true, menu: null })

      const res = await weeklyMenu(profile, allergies, fridge)

      if (!res.success || !res.data) {
        wx.showToast({
          title: (res.error || '生成失败').slice(0, 20),
          icon: 'none',
          duration: 3000,
        })
        this.setData({ loading: false })
        return
      }

      const menu = normalizeWeeklyMenu(res.data)
      const ageId = profile.ageId || '8-10'
      setWeeklyMenu(ageId, menu)
      this.applyMenu(menu)
      this.setData({ loading: false })
    },

    onExport() {
      if (!this.data.menu) {
        wx.showToast({ title: '请先生成一周菜单', icon: 'none' })
        return
      }
      if (this.data.exporting) return

      wx.showActionSheet({
        itemList: ['保存到相册', '预览图片'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.exportImage(true)
          } else if (res.tapIndex === 1) {
            this.exportImage(false)
          }
        },
      })
    },

    exportImage(saveToAlbum) {
      this.setData({ exporting: true })
      wx.showLoading({ title: '生成图片中…', mask: true })

      const exportData = {
        menu: this.data.menu,
        profile: this.data.profile,
        allergyText: this.data.allergyText,
      }

      const runExport = (pageCanvas) =>
        renderWeeklyPoster(exportData, pageCanvas, this)
          .then((filePath) => {
            wx.hideLoading()
            if (saveToAlbum) {
              return ensureAlbumPermission()
                .then(() => saveImageToAlbum(filePath))
                .then(() => {
                  wx.showToast({ title: '已保存到相册', icon: 'success' })
                })
            }
            wx.previewImage({
              urls: [filePath],
              current: filePath,
            })
          })
          .catch((err) => {
            wx.hideLoading()
            const message = (err && err.errMsg) || (err && err.message) || '导出失败'
            console.error('[weekly] export fail:', err)
            if (!/拒绝|cancel/i.test(message)) {
              wx.showToast({
                title: String(message).slice(0, 20),
                icon: 'none',
              })
            }
          })
          .finally(() => {
            this.setData({ exporting: false })
          })

      if (typeof wx.createOffscreenCanvas === 'function') {
        runExport(null)
        return
      }

      this.setData({ showExportCanvas: true }, () => {
        const query = this.createSelectorQuery().in(this)
        query
          .select('#weeklyExportCanvas')
          .fields({ node: true, size: true })
          .exec((res) => {
            const canvas = res[0] && res[0].node
            if (!canvas) {
              wx.hideLoading()
              this.setData({ exporting: false, showExportCanvas: false })
              wx.showToast({ title: '画布初始化失败', icon: 'none' })
              return
            }
            runExport(canvas).finally(() => {
              this.setData({ showExportCanvas: false })
            })
          })
      })
    },
  },
})
