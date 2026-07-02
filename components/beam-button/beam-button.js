const BEAM_STEP = 1.15
const BEAM_INTERVAL = 16

Component({
  properties: {
    text: { type: String, value: '' },
    disabled: { type: Boolean, value: false },
    variant: { type: String, value: 'primary' },
    height: { type: Number, value: 92 },
  },

  data: {
    beamDeg: 0,
  },

  lifetimes: {
    attached() {
      this._beamDeg = 0
      this.startSpin()
    },
    detached() {
      this.stopSpin()
    },
  },

  pageLifetimes: {
    show() {
      this.startSpin()
    },
    hide() {
      this.stopSpin()
    },
  },

  observers: {
    disabled(disabled) {
      if (disabled) {
        this.stopSpin()
      } else {
        this.startSpin()
      }
    },
  },

  methods: {
    onTap() {
      if (this.data.disabled) return
      this.triggerEvent('tap')
    },

    startSpin() {
      if (this._timer || this.data.disabled) return
      this._timer = setInterval(() => {
        if (this.data.disabled) return
        this._beamDeg = (this._beamDeg + BEAM_STEP) % 360
        this.setData({ beamDeg: this._beamDeg })
      }, BEAM_INTERVAL)
    },

    stopSpin() {
      if (this._timer) {
        clearInterval(this._timer)
        this._timer = null
      }
    },
  },
})
