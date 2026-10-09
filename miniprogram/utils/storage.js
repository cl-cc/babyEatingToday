const { DEFAULT_PROFILE, normalizeProfile } = require('./profileDefaults')
const cloudProfile = require('./cloudProfile')

const KEYS = {
  PROFILE: 'baby_profile',
  ALLERGIES: 'baby_allergies',
  FRIDGE: 'fridge_items',
}

let profileCache = null
let profileReadyPromise = null

function readLocalProfile() {
  try {
    const stored = wx.getStorageSync(KEYS.PROFILE) || {}
    return normalizeProfile(stored)
  } catch (e) {
    return normalizeProfile()
  }
}

function readLocalAllergies() {
  try {
    const fromProfile = readLocalProfile().allergies
    if (fromProfile && fromProfile.length) return fromProfile
    return wx.getStorageSync(KEYS.ALLERGIES) || []
  } catch (e) {
    return []
  }
}

function readLocalFridge() {
  try {
    const fromProfile = readLocalProfile().fridge
    if (fromProfile && fromProfile.length) return fromProfile
    return wx.getStorageSync(KEYS.FRIDGE) || []
  } catch (e) {
    return []
  }
}

function readLocalMergedProfile() {
  const profile = readLocalProfile()
  const allergies = readLocalAllergies()
  const fridge = readLocalFridge()
  return normalizeProfile(
    Object.assign({}, profile, {
      allergies: allergies.length ? allergies : profile.allergies,
      fridge: fridge.length ? fridge : profile.fridge,
    })
  )
}

function writeLocalProfile(profile) {
  profileCache = normalizeProfile(profile)
  wx.setStorageSync(KEYS.PROFILE, profileCache)
  wx.setStorageSync(KEYS.ALLERGIES, profileCache.allergies || [])
  wx.setStorageSync(KEYS.FRIDGE, profileCache.fridge || [])
  return profileCache
}

function hasLocalUserData() {
  try {
    const profile = wx.getStorageSync(KEYS.PROFILE)
    if (profile && Object.keys(profile).length) return true
    const allergies = wx.getStorageSync(KEYS.ALLERGIES) || []
    if (allergies.length) return true
    const fridge = wx.getStorageSync(KEYS.FRIDGE) || []
    if (fridge.length) return true
    return false
  } catch (e) {
    return false
  }
}

function getProfile() {
  if (profileCache) return normalizeProfile(profileCache)
  profileCache = readLocalMergedProfile()
  return normalizeProfile(profileCache)
}

function saveProfile(profile) {
  const merged = writeLocalProfile(Object.assign({}, getProfile(), profile))
  if (cloudProfile.isCloudReady()) {
    cloudProfile.upsertProfile(merged).catch((err) => {
      console.warn('[cloud] 用户数据同步失败', err)
    })
  }
  return merged
}

async function initProfileFromCloud() {
  if (!cloudProfile.isCloudReady()) {
    profileCache = readLocalMergedProfile()
    return profileCache
  }

  try {
    const [cloudData, localData] = await Promise.all([
      cloudProfile.fetchProfile(),
      Promise.resolve(readLocalMergedProfile()),
    ])

    if (cloudData) {
      profileCache = writeLocalProfile(cloudData)
      console.log('[cloud] 已从云端恢复用户数据', {
        allergies: profileCache.allergies.length,
        fridge: profileCache.fridge.length,
        eatenFoods: profileCache.eatenFoods.length,
      })
      return profileCache
    }

    if (hasLocalUserData()) {
      profileCache = writeLocalProfile(localData)
      await cloudProfile.upsertProfile(profileCache)
      console.log('[cloud] 已将本地用户数据迁移到云端', {
        allergies: profileCache.allergies.length,
        fridge: profileCache.fridge.length,
        eatenFoods: profileCache.eatenFoods.length,
      })
      return profileCache
    }

    profileCache = writeLocalProfile(DEFAULT_PROFILE)
    await cloudProfile.upsertProfile(profileCache)
    console.log('[cloud] 已创建默认用户数据')
    return profileCache
  } catch (err) {
    console.warn('[cloud] 拉取用户数据失败，使用本地缓存', err)
    profileCache = readLocalMergedProfile()
    return profileCache
  }
}

function getProfileReady() {
  if (!profileReadyPromise) {
    profileReadyPromise = initProfileFromCloud()
  }
  return profileReadyPromise
}

function getAllergies() {
  return getProfile().allergies || []
}

function saveAllergies(list) {
  const allergies = Array.isArray(list) ? list : []
  saveProfile({ allergies })
  return allergies
}

function getAllergyNames() {
  return getAllergies().map((a) => a.name)
}

function isAllergic(name) {
  return getAllergies().some((a) => a.name === name)
}

function setFoodAllergy(food, allergic) {
  const list = getAllergies().slice()
  const idx = list.findIndex((a) => a.name === food.name)
  if (allergic) {
    if (idx < 0) {
      list.push({
        name: food.name,
        subCategory: food.subCategory || '',
        category: food.categoryName || food.category || '',
      })
    }
  } else if (idx >= 0) {
    list.splice(idx, 1)
  }
  saveAllergies(list)
  return list
}

function getFridge() {
  return getProfile().fridge || []
}

function saveFridge(items) {
  const fridge = Array.isArray(items) ? items : []
  saveProfile({ fridge })
  return fridge
}

function getEatenFoods() {
  return getProfile().eatenFoods || []
}

function saveEatenFoods(list) {
  const eatenFoods = Array.isArray(list) ? list : []
  saveProfile({ eatenFoods })
  return eatenFoods
}

function getEatenNames() {
  return getEatenFoods().map((f) => f.name)
}

function isEaten(name) {
  return getEatenFoods().some((f) => f.name === name)
}

function setFoodEaten(food, eaten) {
  const list = getEatenFoods().slice()
  const idx = list.findIndex((f) => f.name === food.name)
  if (eaten) {
    if (idx < 0) {
      list.push({
        name: food.name,
        subCategory: food.subCategory || '',
        category: food.categoryName || food.category || '',
      })
    }
  } else if (idx >= 0) {
    list.splice(idx, 1)
  }
  saveEatenFoods(list)
  return list
}

module.exports = {
  KEYS,
  DEFAULT_PROFILE,
  getProfile,
  saveProfile,
  getProfileReady,
  initProfileFromCloud,
  getAllergies,
  saveAllergies,
  getAllergyNames,
  isAllergic,
  setFoodAllergy,
  getFridge,
  saveFridge,
  getEatenFoods,
  saveEatenFoods,
  getEatenNames,
  isEaten,
  setFoodEaten,
}
