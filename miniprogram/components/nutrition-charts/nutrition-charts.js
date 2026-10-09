const echarts = require('../ec-canvas/echarts')

function buildPieOption(categoryShare) {
  const list = categoryShare || []
  return {
    color: list.map((item) => item.color),
    tooltip: {
      trigger: 'item',
      formatter: '{b} {c}%',
    },
    series: [
      {
        type: 'pie',
        radius: ['46%', '72%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#FFFFFF',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          fontSize: 11,
          color: '#666666',
        },
        labelLine: {
          length: 8,
          length2: 6,
        },
        data: list.map((item) => ({
          name: item.label,
          value: item.value,
        })),
      },
    ],
  }
}

function buildBarOption(dailyTrend, lineSeries) {
  const trend = dailyTrend || []
  const seriesDefs = lineSeries || []
  const days = trend.map((item) => String(item.day || '').replace('周', ''))

  return {
    color: seriesDefs.map((item) => item.color),
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: {
      data: seriesDefs.map((item) => item.label),
      bottom: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        fontSize: 11,
        color: '#888888',
      },
    },
    grid: {
      left: 36,
      right: 12,
      top: 28,
      bottom: 52,
    },
    xAxis: {
      type: 'category',
      data: days,
      axisLine: { lineStyle: { color: '#E8E2EE' } },
      axisLabel: {
        color: '#888888',
        fontSize: 11,
      },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      min: 50,
      max: 100,
      splitLine: { lineStyle: { color: '#F2EBE6' } },
      axisLabel: {
        color: '#BBBBBB',
        fontSize: 10,
      },
    },
    series: seriesDefs.map((item) => ({
      name: item.label,
      type: 'bar',
      barMaxWidth: 14,
      barGap: '18%',
      itemStyle: {
        color: item.color,
        borderRadius: [6, 6, 0, 0],
      },
      data: trend.map((day) => Number(day[item.key]) || 0),
    })),
  }
}

function createPieInit(component) {
  return function initPieChart(canvas, width, height, dpr) {
    const chart = echarts.init(canvas, null, {
      width,
      height,
      devicePixelRatio: dpr,
    })
    canvas.setChart(chart)
    component.pieChart = chart
    if (component.data.analysis) {
      chart.setOption(buildPieOption(component.data.analysis.categoryShare), true)
    }
    return chart
  }
}

function createBarInit(component) {
  return function initBarChart(canvas, width, height, dpr) {
    const chart = echarts.init(canvas, null, {
      width,
      height,
      devicePixelRatio: dpr,
    })
    canvas.setChart(chart)
    component.barChart = chart
    if (component.data.analysis) {
      chart.setOption(
        buildBarOption(
          component.data.analysis.dailyTrend,
          component.data.analysis.lineSeries
        ),
        true
      )
    }
    return chart
  }
}

Component({
  properties: {
    analysis: {
      type: Object,
      value: null,
      observer(newVal) {
        if (newVal) this.bootstrapCharts()
      },
    },
  },

  data: {
    ecPie: {
      lazyLoad: true,
    },
    ecBar: {
      lazyLoad: true,
    },
  },

  lifetimes: {
    ready() {
      this.pieInit = createPieInit(this)
      this.barInit = createBarInit(this)
      this.setData(
        {
          ecPie: { lazyLoad: true, onInit: this.pieInit },
          ecBar: { lazyLoad: true, onInit: this.barInit },
        },
        () => {
          this.bootstrapCharts()
        }
      )
    },

    detached() {
      if (this.pieChart) {
        this.pieChart.dispose()
        this.pieChart = null
      }
      if (this.barChart) {
        this.barChart.dispose()
        this.barChart = null
      }
    },
  },

  methods: {
    bootstrapCharts() {
      if (!this.data.analysis) return
      if (!this.pieInit || !this.barInit) return

      wx.nextTick(() => {
        this.initChartComponents()
        if (this._chartTimer) clearTimeout(this._chartTimer)
        this._chartTimer = setTimeout(() => {
          this.renderCharts(this.data.analysis)
          this._chartTimer = null
        }, 120)
      })
    },

    initChartComponents() {
      if (!this.pieComponent) {
        this.pieComponent = this.selectComponent('#pie-chart')
      }
      if (!this.barComponent) {
        this.barComponent = this.selectComponent('#bar-chart')
      }
      if (this.pieComponent && this.pieComponent.init && !this.pieChart) {
        this.pieComponent.init()
      }
      if (this.barComponent && this.barComponent.init && !this.barChart) {
        this.barComponent.init()
      }
    },

    renderCharts(analysis) {
      if (!analysis) return

      const pieOption = buildPieOption(analysis.categoryShare)
      const barOption = buildBarOption(analysis.dailyTrend, analysis.lineSeries)

      if (this.pieChart) {
        this.pieChart.setOption(pieOption, true)
      }
      if (this.barChart) {
        this.barChart.setOption(barOption, true)
      }
    },
  },
})
