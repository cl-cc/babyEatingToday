Component({
  data: {
    selected: 0,
    beamDeg: 0,
    list: [
      { pagePath: '/pages/index/index', emoji: '🥕', text: '今日' },
      { pagePath: '/pages/combine/combine', emoji: '🥩', text: '搭配' },
      { pagePath: '/pages/can-eat/can-eat', text: '', center: true, img: '/image/search.png' },
      { pagePath: '/pages/desensitize/desensitize', emoji: '🛡️', text: '辅食排敏' },
      { pagePath: '/pages/weekly/weekly', emoji: '📅', text: '一周' },
    ],
  },

  lifetimes: {
    attached() {
      this.startBeamSpin()
    },
    detached() {
      this.stopBeamSpin()
    },
  },

  pageLifetimes: {
    show() {
      this.startBeamSpin()
    },
    hide() {
      this.stopBeamSpin()
    },
  },

  methods: {
    startBeamSpin() {
      if (this._beamTimer) return
      this._beamDeg = this._beamDeg || 0
      this._beamTimer = setInterval(() => {
        this._beamDeg = (this._beamDeg + 1.15) % 360
        this.setData({ beamDeg: this._beamDeg })
      }, 16)
    },

    stopBeamSpin() {
      if (this._beamTimer) {
        clearInterval(this._beamTimer)
        this._beamTimer = null
      }
    },

    switchTab(e) {
      const index = e.currentTarget.dataset.index
      const item = this.data.list[index]
      if (index === this.data.selected) return
      wx.reLaunch({ url: item.pagePath })
    },

    setSelected(index) {
      this.setData({ selected: index })
    },
  },
})
