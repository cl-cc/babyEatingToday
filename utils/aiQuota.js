const STORAGE_KEY = 'ai_daily_quota'
const DAILY_LIMIT = 10

const QUOTA_TITLE = '团子累趴了 🍡'
const QUOTA_MESSAGE =
  `今天已经帮你想满 ${DAILY_LIMIT} 次啦～\n营养师揉揉小脑瓜，明天再来找团子吧～`
const QUOTA_TOAST = `团子今天已经帮你想满 ${DAILY_LIMIT} 次啦～明天再来哦 🍡`

function todayStr() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function readQuota() {
  try {
    const data = wx.getStorageSync(STORAGE_KEY) || {}
    if (data.date !== todayStr()) {
      return { date: todayStr(), count: 0 }
    }
    return {
      date: data.date,
      count: Number(data.count) || 0,
    }
  } catch (e) {
    return { date: todayStr(), count: 0 }
  }
}

function writeQuota(quota) {
  try {
    wx.setStorageSync(STORAGE_KEY, quota)
  } catch (e) {
    console.warn('[aiQuota] 写入失败', e)
  }
}

function getQuotaCount() {
  return readQuota().count
}

function getQuotaRemain() {
  return Math.max(0, DAILY_LIMIT - getQuotaCount())
}

function isAIQuotaExceeded() {
  return getQuotaCount() >= DAILY_LIMIT
}

function consumeAIQuota() {
  const quota = readQuota()
  if (quota.count >= DAILY_LIMIT) {
    return { allowed: false, count: quota.count, remain: 0 }
  }
  const next = { date: quota.date, count: quota.count + 1 }
  writeQuota(next)
  return {
    allowed: true,
    count: next.count,
    remain: DAILY_LIMIT - next.count,
  }
}

function showAIQuotaTip() {
  const now = Date.now()
  if (showAIQuotaTip._until && now < showAIQuotaTip._until) return
  showAIQuotaTip._until = now + 2600
  wx.showModal({
    title: QUOTA_TITLE,
    content: QUOTA_MESSAGE,
    showCancel: false,
    confirmText: '好哒',
    confirmColor: '#E85A7A',
  })
}

module.exports = {
  DAILY_LIMIT,
  QUOTA_TITLE,
  QUOTA_MESSAGE,
  QUOTA_TOAST,
  getQuotaCount,
  getQuotaRemain,
  isAIQuotaExceeded,
  consumeAIQuota,
  showAIQuotaTip,
}
