const { AGE_GROUPS, pickRandomSet, getAgeMonths } = require('../../utils/foodData')
const { getProfile, saveProfile, getAllergies, getProfileReady } = require('../../utils/storage')
const {
  isCheckedInToday,
  getCheckInCount,
  addTodayCheckIn,
  buildConfettiBurst,
} = require('../../utils/checkIn')
const { todayRecommend, todaySuggestion, randomDayMenu, isAIReady } = require('../../utils/ai')
const { normalizeTodayRecommend, normalizeRandomMenu } = require('../../utils/nutritionHelper')
const { normalizeTodaySuggestion, buildLocalSuggestion } = require('../../utils/foodNutrition')

const {
  getTodayRecommend,
  setTodayRecommend,
  clearTodayRecommend,
  getTodaySuggestion,
  setTodaySuggestion,
} = require('../../utils/aiCache')

const { pickRandomWarmTip } = require('../../utils/warmTips')

const MEAL_LABELS = {
  breakfast: '🌅 早餐',
  lunch: '☀️ 午餐',
  dinner: '🌙 晚餐',
  snack: '🍪 加餐',
}

Component({
  data: {
    ageGroups: AGE_GROUPS,
    selectedAge: '8-10',
    selectedAgeLabel: '8-10个月',
    ageExpanded: false,
    agePanelHeight: 0,
    selectedGender: '',
    showGenderPicker: false,
    dailySuggestion: null,
    suggestionLoading: false,
    foods: [],
    seasonings: [],
    mealTags: [],
    nutritionRings: [],
    tip: '',
    loading: false,
    randomLoading: false,
    mealList: [],
    hasRecommend: false,
    warmTipText: '',
    warmTipVisible: true,
    checkedInToday: false,
    checkInCount: 0,
    checkInLoading: false,
    showCheckInConfetti: false,
    confettiPieces: [],
  },

  lifetimes: {
    attached() {
      this.bootstrapPage()
      this.startWarmTipRotation()
    },
    detached() {
      if (this._ageCollapseTimer) clearTimeout(this._ageCollapseTimer)
      if (this._confettiTimer) clearTimeout(this._confettiTimer)
      this.stopWarmTipRotation()
    },
  },

  pageLifetimes: {
    show() {
      this.syncProfileFromCloud()
      if (!this.data.warmTipVisible) {
        this.setData({ warmTipVisible: true })
      }
      if (!this._warmTipTimer) {
        this.startWarmTipRotation()
      }
    },
    hide() {
      this.stopWarmTipRotation()
    },
  },

  methods: {
    startWarmTipRotation() {
      this.stopWarmTipRotation()
      this.switchWarmTip(true)
      this._warmTipTimer = setInterval(() => {
        this.switchWarmTip()
      }, 5000)
    },

    switchWarmTip(immediate) {
      if (immediate) {
        this.setData({
          warmTipText: pickRandomWarmTip(''),
          warmTipVisible: true,
        })
        return
      }

      this.setData({ warmTipVisible: false })
      if (this._warmTipAnimTimer) clearTimeout(this._warmTipAnimTimer)
      this._warmTipAnimTimer = setTimeout(() => {
        this.setData({
          warmTipText: pickRandomWarmTip(this.data.warmTipText),
          warmTipVisible: true,
        })
        this._warmTipAnimTimer = null
      }, 320)
    },

    stopWarmTipRotation() {
      if (this._warmTipTimer) {
        clearInterval(this._warmTipTimer)
        this._warmTipTimer = null
      }
      if (this._warmTipAnimTimer) {
        clearTimeout(this._warmTipAnimTimer)
        this._warmTipAnimTimer = null
      }
      if (!this.data.warmTipVisible) {
        this.setData({ warmTipVisible: true })
      }
    },

    async bootstrapPage() {
      await getProfileReady()
      this.applyProfileState()
      this.getTabBar()?.setSelected(0)
      this.showRecommendForAge(this.data.selectedAge)
      this.loadDailySuggestion(this.data.selectedAge)
    },

    async syncProfileFromCloud() {
      await getProfileReady()
      const prevAge = this.data.selectedAge
      const prevGender = this.data.selectedGender
      this.applyProfileState()
      if (this.data.selectedAge !== prevAge) {
        this.showRecommendForAge(this.data.selectedAge)
      }
      if (
        this.data.selectedAge !== prevAge ||
        this.data.selectedGender !== prevGender
      ) {
        this.loadDailySuggestion(this.data.selectedAge)
      }
    },

    applyProfileState() {
      const profile = getProfile()
      const ageId = profile.ageId || '8-10'
      const gender = profile.gender || ''
      this.setData({
        selectedAge: ageId,
        selectedAgeLabel: this.getAgeLabel(ageId),
        selectedGender: gender,
        showGenderPicker: false,
        checkedInToday: isCheckedInToday(profile),
        checkInCount: getCheckInCount(profile),
      })
    },

    async onDailyCheckIn() {
      if (this.data.checkedInToday || this.data.checkInLoading) {
        if (this.data.checkedInToday) {
          wx.showToast({ title: '今日已打卡啦', icon: 'none' })
        }
        return
      }

      this.setData({ checkInLoading: true })

      try {
        await getProfileReady()
        const result = addTodayCheckIn(getProfile())
        if (result.alreadyChecked) {
          this.setData({ checkedInToday: true, checkInLoading: false })
          wx.showToast({ title: '今日已打卡啦', icon: 'none' })
          return
        }

        saveProfile({ checkInDates: result.profile.checkInDates })
        this.playCheckInCelebration()
        this.setData({
          checkedInToday: true,
          checkInCount: result.profile.checkInDates.length,
          checkInLoading: false,
        })
        wx.showToast({ title: '打卡成功 🎉', icon: 'none' })
      } catch (err) {
        console.warn('[checkIn] 打卡失败', err)
        this.setData({ checkInLoading: false })
        wx.showToast({ title: '打卡失败，请重试', icon: 'none' })
      }
    },

    playCheckInCelebration() {
      if (wx.vibrateShort) {
        wx.vibrateShort({ type: 'light' })
      }
      this.setData({
        showCheckInConfetti: true,
        confettiPieces: buildConfettiBurst(10),
      })
      if (this._confettiTimer) clearTimeout(this._confettiTimer)
      this._confettiTimer = setTimeout(() => {
        this.setData({ showCheckInConfetti: false, confettiPieces: [] })
        this._confettiTimer = null
      }, 1300)
    },

    getAgeLabel(ageId) {
      const group = this.data.ageGroups.find((item) => item.id === ageId)
      return group ? group.label : '8-10个月'
    },

    toggleAgePicker() {
      if (this.data.ageExpanded) {
        this.collapseAgePicker()
        return
      }
      this.expandAgePicker()
    },

    expandAgePicker() {
      this.setData({ ageExpanded: true, agePanelHeight: 0 }, () => {
        wx.nextTick(() => {
          this.measureAgePanel()
        })
      })
    },

    measureAgePanel() {
      this.createSelectorQuery()
        .in(this)
        .select('#ageRow')
        .boundingClientRect((rect) => {
          if (!rect || !rect.height) return
          this.setData({ agePanelHeight: Math.ceil(rect.height) + 24 })
        })
        .exec()
    },

    collapseAgePicker() {
      this.setData({ agePanelHeight: 0 })
      if (this._ageCollapseTimer) clearTimeout(this._ageCollapseTimer)
      this._ageCollapseTimer = setTimeout(() => {
        this.setData({ ageExpanded: false })
        this._ageCollapseTimer = null
      }, 380)
    },

    getTabBar() {
      return this.selectComponent('#tabBar')
    },

    showAIError(error) {
      wx.showToast({
        title: (error || 'AI 请求失败').slice(0, 20),
        icon: 'none',
        duration: 3000,
      })
    },

    applySuggestionData(data) {
      this.setData({
        dailySuggestion: normalizeTodaySuggestion(data),
        suggestionLoading: false,
      })
    },

    buildLocalDailySuggestion(ageId) {
      return buildLocalSuggestion(ageId, getAllergies())
    },

    async loadDailySuggestion(ageId, force = false) {
      const gender = this.data.selectedGender
      if (!force) {
        const cached = getTodaySuggestion(ageId, gender)
        if (cached) {
          this.applySuggestionData(cached)
          return
        }
      }

      const profile = getProfile()
      const allergies = getAllergies()
      const ageMonths = getAgeMonths(ageId)

      this.setData({ suggestionLoading: true })

      if (!isAIReady()) {
        const local = this.buildLocalDailySuggestion(ageId)
        setTodaySuggestion(ageId, gender, local)
        this.applySuggestionData(local)
        return
      }

      const aiRes = await todaySuggestion(
        { ...profile, ageId, ageMonths, gender },
        allergies
      )
      if (aiRes.success && aiRes.data?.food) {
        const normalized = normalizeTodaySuggestion(aiRes.data)
        setTodaySuggestion(ageId, gender, normalized)
        this.applySuggestionData(normalized)
        return
      }

      const local = this.buildLocalDailySuggestion(ageId)
      setTodaySuggestion(ageId, gender, local)
      this.applySuggestionData(local)
    },

    applyRecommendData(data, ageId) {
      const normalized = normalizeTodayRecommend(data, ageId || this.data.selectedAge)
      this.setData({
        foods: normalized.foods,
        seasonings: normalized.seasonings,
        mealTags: normalized.mealTags,
        nutritionRings: normalized.nutritionRings,
        tip: normalized.tip,
        loading: false,
        hasRecommend: !!(normalized.foods && normalized.foods.length),
      })
    },

    buildLocalRecommend(ageId) {
      const allergies = getAllergies()
      const { set } = pickRandomSet(ageId)
      const filtered = set.foods.filter(
        (f) => !allergies.some((a) => f.name.includes(a.name))
      )
      const foods = filtered.length ? filtered : set.foods
      return normalizeTodayRecommend({
        foods,
        seasonings: set.seasonings,
        tip: '',
      }, ageId)
    },

    showRecommendForAge(ageId) {
      const cached = getTodayRecommend(ageId)
      if (cached) {
        this.applyRecommendData(cached, ageId)
        return
      }
      this.loadRecommendation(ageId, true)
    },

    async loadRecommendation(ageId, force = false) {
      if (!force) {
        const cached = getTodayRecommend(ageId)
        if (cached) {
          this.applyRecommendData(cached, ageId)
          return
        }
      }

      const profile = getProfile()
      const allergies = getAllergies()
      const ageMonths = getAgeMonths(ageId)

      if (!isAIReady()) {
        this.setData({ loading: true })
        const local = this.buildLocalRecommend(ageId)
        setTodayRecommend(ageId, local)
        this.applyRecommendData(local, ageId)
        return
      }

      this.setData({ loading: true })

      const aiRes = await todayRecommend(
        { ...profile, ageId, ageMonths },
        allergies
      )
      if (aiRes.success && aiRes.data?.foods?.length) {
        const normalized = normalizeTodayRecommend(aiRes.data, ageId)
        setTodayRecommend(ageId, normalized)
        this.applyRecommendData(normalized, ageId)
        return
      }

      this.showAIError(aiRes.error)
      const local = this.buildLocalRecommend(ageId)
      setTodayRecommend(ageId, local)
      this.applyRecommendData(local, ageId)
    },

    onSelectAge(e) {
      const ageId = e.currentTarget.dataset.id
      if (ageId === this.data.selectedAge) {
        this.collapseAgePicker()
        return
      }
      this.setData({
        selectedAge: ageId,
        selectedAgeLabel: this.getAgeLabel(ageId),
      })
      saveProfile({ ageId, ageMonths: getAgeMonths(ageId) })
      this.collapseAgePicker()
      this.showRecommendForAge(ageId)
      this.loadDailySuggestion(ageId, true)
    },

    onSelectGender(e) {
      const gender = e.currentTarget.dataset.gender
      if (gender === this.data.selectedGender && !this.data.showGenderPicker) return
      this.setData({ selectedGender: gender, showGenderPicker: false })
      saveProfile({ gender })
      this.loadDailySuggestion(this.data.selectedAge, true)
    },

    onEditGender() {
      this.setData({ showGenderPicker: true })
    },

    onRefresh() {
      if (this.data.loading) return
      clearTodayRecommend(this.data.selectedAge)
      this.loadRecommendation(this.data.selectedAge, true)
    },

    buildMealList(menu) {
      return ['breakfast', 'lunch', 'dinner', 'snack'].map((key) => ({
        key,
        label: MEAL_LABELS[key],
        foods: menu[key].foods || [],
        seasonings: menu[key].seasonings || [],
        totalCalories: menu[key].totalCalories || 0,
      }))
    },

    async onRandomMenu() {
      const profile = getProfile()
      const allergies = getAllergies()
      const ageId = this.data.selectedAge
      const ageMonths = getAgeMonths(ageId)

      this.setData({ randomLoading: true, mealList: [] })

      if (!isAIReady()) {
        wx.showToast({ title: '请先配置 API Key', icon: 'none' })
        this.setData({ randomLoading: false })
        return
      }

      const res = await randomDayMenu({ ...profile, ageId, ageMonths }, allergies)
      if (!res.success || !res.data) {
        this.showAIError(res.error)
        this.setData({ randomLoading: false })
        return
      }

      const menu = normalizeRandomMenu(res.data)
      this.setData({
        mealList: this.buildMealList(menu),
        randomLoading: false,
      })
    },
  },
})
