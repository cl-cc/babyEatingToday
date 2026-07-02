const { CATEGORIES, groupByCategory } = require('../../utils/ingredients')
const { getProfile, getAllergies, getFridge, saveFridge, getProfileReady } = require('../../utils/storage')
const { getAgeMonths } = require('../../utils/foodData')
const { smartCombine, fridgeMatch, isAIReady } = require('../../utils/ai')
const { normalizeCombineResult, normalizeFridgeResult } = require('../../utils/nutritionHelper')
const { getCombinePick, setCombinePick, getCombineFridge, setCombineFridge } = require('../../utils/aiCache')
const { guessFoodEmoji } = require('../../utils/foodEmoji')

Component({
  data: {
    mode: 'pick',
    categories: CATEGORIES,
    activeCategory: '全部',
    displayGroups: [],
    customFoods: [],
    customInput: '',
    customInputEmoji: '➕',
    selected: [],
    loading: false,
    result: null,
    fromAI: false,
  },

  lifetimes: {
    attached() {
      this.bootstrapPage()
    },
  },

  pageLifetimes: {
    show() {
      this.reloadModeState()
    },
  },

  methods: {
    async bootstrapPage() {
      await getProfileReady()
      this.loadModeState(this.data.mode)
      this.getTabBar()?.setSelected(1)
    },

    async reloadModeState() {
      await getProfileReady()
      this.loadModeState(this.data.mode)
    },

    getTabBar() {
      return this.selectComponent('#tabBar')
    },

    getAgeId() {
      return getProfile().ageId || '8-10'
    },

    getModeCache(mode) {
      const ageId = this.getAgeId()
      return mode === 'pick' ? getCombinePick(ageId) : getCombineFridge(ageId)
    },

    saveModeState(mode) {
      const targetMode = mode || this.data.mode
      const ageId = this.getAgeId()
      const payload = {
        selected: this.data.selected,
        customFoods: this.data.customFoods,
        activeCategory: this.data.activeCategory,
        result: this.data.result,
        fromAI: this.data.fromAI,
      }
      if (targetMode === 'pick') {
        setCombinePick(ageId, payload)
      } else {
        setCombineFridge(ageId, payload)
      }
    },

    buildDisplayGroups(activeCategory, selectedNames) {
      const allergies = getAllergies().map((a) => a.name)
      return groupByCategory(activeCategory, {
        selectedNames,
        allergyNames: allergies,
      })
    },

    getAllDisplayItems() {
      return (this.data.displayGroups || []).reduce(
        (acc, group) => acc.concat(group.items),
        []
      )
    },

    updateDisplayGroups(groups) {
      return groups.map((group) => ({
        category: group.category,
        items: group.items.map((item) => Object.assign({}, item)),
      }))
    },

    applySelectionState(state) {
      const selected = state.selected || []
      const customFoods = (state.customFoods || []).map((c) =>
        Object.assign({}, c, { selected: selected.some((s) => s.name === c.name) })
      )
      const activeCategory = state.activeCategory || '全部'
      const selectedNames = selected.map((s) => s.name)
      const displayGroups = this.buildDisplayGroups(activeCategory, selectedNames)

      this.setData({
        selected,
        customFoods,
        activeCategory,
        displayGroups,
        result: state.result || null,
        fromAI: !!state.fromAI,
      })
    },

    loadModeState(mode) {
      let cached = this.getModeCache(mode)

      if (mode === 'fridge' && (!cached || !cached.selected || !cached.selected.length)) {
        const fridge = getFridge()
        if (fridge.length) {
          cached = Object.assign({}, cached || {}, { selected: fridge })
        }
      }

      if (!cached) {
        this.setData({
          selected: [],
          customFoods: [],
          activeCategory: '全部',
          displayGroups: this.buildDisplayGroups('全部', []),
          result: null,
          fromAI: false,
        })
        return
      }

      this.applySelectionState(cached)
    },

    mergeSelected(listSelected) {
      const customSelected = this.data.customFoods.filter((c) => c.selected)
      const names = new Set()
      const merged = []
      listSelected.concat(customSelected).forEach((item) => {
        if (!names.has(item.name)) {
          names.add(item.name)
          merged.push(item)
        }
      })
      return merged
    },

    setMode(e) {
      const mode = e.currentTarget.dataset.mode
      if (mode === this.data.mode) return

      this.saveModeState(this.data.mode)
      this.setData({ mode, customInput: '', customInputEmoji: '➕' })
      this.loadModeState(mode)
    },

    onCategory(e) {
      const cat = e.currentTarget.dataset.cat
      const selectedNames = this.data.selected.map((s) => s.name)
      const displayGroups = this.buildDisplayGroups(cat, selectedNames)
      this.setData({ activeCategory: cat, displayGroups }, () => {
        this.saveModeState()
      })
    },

    toggleIngredient(e) {
      const name = e.currentTarget.dataset.name
      const displayGroups = this.updateDisplayGroups(this.data.displayGroups).map((group) => ({
        category: group.category,
        items: group.items.map((i) =>
          i.name === name ? Object.assign({}, i, { selected: !i.selected }) : i
        ),
      }))
      const allItems = displayGroups.reduce((acc, group) => acc.concat(group.items), [])
      const selected = this.mergeSelected(allItems.filter((i) => i.selected))
      this.setData(
        {
          displayGroups,
          selected,
          result: null,
          fromAI: false,
        },
        () => {
          this.saveModeState()
          if (this.data.mode === 'fridge') saveFridge(selected)
        }
      )
    },

    toggleCustomFood(e) {
      const name = e.currentTarget.dataset.name
      const customFoods = this.data.customFoods.map((c) =>
        c.name === name ? Object.assign({}, c, { selected: !c.selected }) : c
      )
      const listSelected = this.getAllDisplayItems().filter((i) => i.selected)
      const selected = []
      const names = new Set()
      listSelected.concat(customFoods.filter((c) => c.selected)).forEach((item) => {
        if (!names.has(item.name)) {
          names.add(item.name)
          selected.push(item)
        }
      })
      this.setData(
        {
          customFoods,
          selected,
          result: null,
          fromAI: false,
        },
        () => {
          this.saveModeState()
          if (this.data.mode === 'fridge') saveFridge(selected)
        }
      )
    },

    onCustomInput(e) {
      const customInput = e.detail.value
      this.setData({
        customInput,
        customInputEmoji: guessFoodEmoji(customInput),
      })
    },

    addCustomFood() {
      const name = (this.data.customInput || '').trim()
      if (!name) {
        wx.showToast({ title: '请输入菜名', icon: 'none' })
        return
      }
      if (
        this.data.customFoods.some((c) => c.name === name) ||
        this.getAllDisplayItems().some((i) => i.name === name)
      ) {
        wx.showToast({ title: '已有该食材', icon: 'none' })
        return
      }
      const item = {
        emoji: guessFoodEmoji(name, { fallback: '✏️' }),
        name,
        custom: true,
        selected: true,
      }
      const customFoods = this.data.customFoods.concat([item])
      const selected = this.mergeSelected(
        this.getAllDisplayItems().filter((i) => i.selected).concat([item])
      )
      this.setData(
        {
          customFoods,
          customInput: '',
          customInputEmoji: '➕',
          selected,
          result: null,
          fromAI: false,
        },
        () => {
          this.saveModeState()
          if (this.data.mode === 'fridge') saveFridge(selected)
        }
      )
      wx.showToast({ title: '已添加', icon: 'success', duration: 1000 })
    },

    removeCustomFood(e) {
      const name = e.currentTarget.dataset.name
      const customFoods = this.data.customFoods.filter((c) => c.name !== name)
      const selected = this.data.selected.filter((s) => s.name !== name)
      this.setData(
        {
          customFoods,
          selected,
          result: null,
          fromAI: false,
        },
        () => {
          this.saveModeState()
          if (this.data.mode === 'fridge') saveFridge(selected)
        }
      )
    },

    async onSubmit() {
      const { selected, mode } = this.data
      if (selected.length < 2) {
        wx.showToast({ title: '至少选2种食材哦', icon: 'none' })
        return
      }

      if (!isAIReady()) {
        wx.showToast({ title: '请先配置 API Key', icon: 'none' })
        return
      }

      const profile = getProfile()
      const ageId = profile.ageId || '8-10'
      const allergies = getAllergies()
      this.setData({ loading: true })

      const profileWithAge = Object.assign({}, profile, {
        ageId,
        ageMonths: getAgeMonths(ageId),
      })
      const res =
        mode === 'pick'
          ? await smartCombine(selected, profileWithAge, allergies)
          : await fridgeMatch(selected, profileWithAge, allergies)

      if (mode === 'fridge') saveFridge(selected)

      if (!res.success || !res.data) {
        wx.showToast({
          title: (res.error || '搭配失败').slice(0, 20),
          icon: 'none',
          duration: 3000,
        })
        this.setData({ loading: false })
        return
      }

      const result =
        mode === 'pick'
          ? normalizeCombineResult(res.data)
          : normalizeFridgeResult(res.data)

      this.setData({ result, fromAI: true, loading: false }, () => {
        this.saveModeState()
      })
    },
  },
})
