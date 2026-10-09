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

module.exports = {
  buildPieOption,
  buildBarOption,
}
