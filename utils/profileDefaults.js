const DEFAULT_PROFILE = {
  name: '宝贝',
  gender: '',
  ageId: '8-10',
  ageMonths: 9,
  birthDate: '',
  dislikes: [],
  fridge: [],
  allergies: [],
  eatenFoods: [],
  checkInDates: [],
}

const PROFILE_FIELDS = [
  'name',
  'gender',
  'ageId',
  'ageMonths',
  'birthDate',
  'dislikes',
  'fridge',
  'allergies',
  'eatenFoods',
  'checkInDates',
]

function normalizeAllergy(item) {
  if (!item || typeof item !== 'object') return null
  const name = String(item.name || '').trim()
  if (!name) return null
  return {
    name,
    subCategory: item.subCategory || '',
    category: item.category || item.categoryName || '',
  }
}

function normalizeEatenFood(item) {
  if (!item || typeof item !== 'object') return null
  const name = String(item.name || '').trim()
  if (!name) return null
  return {
    name,
    subCategory: item.subCategory || '',
    category: item.category || item.categoryName || '',
  }
}

function normalizeFridgeItem(item) {
  if (!item || typeof item !== 'object') return null
  const name = String(item.name || '').trim()
  if (!name) return null
  return {
    name,
    emoji: item.emoji || '🥗',
    category: item.category || '',
  }
}

function normalizeProfile(data) {
  const base = Object.assign({}, DEFAULT_PROFILE)
  if (!data || typeof data !== 'object') return base

  PROFILE_FIELDS.forEach((key) => {
    if (key === 'fridge') return
    if (key === 'allergies') return
    if (key === 'eatenFoods') return
    if (key === 'checkInDates') return
    if (data[key] !== undefined && data[key] !== null) {
      base[key] = data[key]
    }
  })

  if (Array.isArray(data.fridge)) {
    base.fridge = data.fridge.map(normalizeFridgeItem).filter(Boolean)
  }

  if (Array.isArray(data.allergies)) {
    base.allergies = data.allergies.map(normalizeAllergy).filter(Boolean)
  }

  if (Array.isArray(data.eatenFoods)) {
    base.eatenFoods = data.eatenFoods.map(normalizeEatenFood).filter(Boolean)
  }

  if (Array.isArray(data.checkInDates)) {
    base.checkInDates = data.checkInDates.map(String).filter(Boolean)
  }

  if (base.ageId === '2+') {
    base.ageId = '2-3'
    if (!base.ageMonths || base.ageMonths === 30) {
      base.ageMonths = 30
    }
  }

  return base
}

module.exports = {
  DEFAULT_PROFILE,
  PROFILE_FIELDS,
  normalizeProfile,
}
