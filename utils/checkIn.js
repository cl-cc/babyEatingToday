const { normalizeProfile } = require('./profileDefaults')

const CONFETTI_EMOJIS = ['🌸', '✨', '🎉', '💖', '⭐', '🌟', '💕', '🎊', '🥳', '🍀']

function getTodayDateKey() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function normalizeCheckInDates(dates) {
  if (!Array.isArray(dates)) return []
  return dates.map(String).filter(Boolean)
}

function isCheckedInToday(profile) {
  const today = getTodayDateKey()
  return normalizeCheckInDates(profile && profile.checkInDates).includes(today)
}

function getCheckInCount(profile) {
  return normalizeCheckInDates(profile && profile.checkInDates).length
}

function addTodayCheckIn(profile) {
  const today = getTodayDateKey()
  const dates = normalizeCheckInDates(profile && profile.checkInDates)
  if (dates.includes(today)) {
    return {
      profile: normalizeProfile(profile),
      alreadyChecked: true,
    }
  }
  return {
    profile: normalizeProfile(
      Object.assign({}, profile, {
        checkInDates: dates.concat(today),
      })
    ),
    alreadyChecked: false,
  }
}

function buildConfettiBurst(count) {
  const total = count || 10
  return CONFETTI_EMOJIS.slice(0, total).map((emoji, i) => {
    const angle = (Math.PI * 2 * i) / total + Math.random() * 0.4
    const dist = 70 + Math.random() * 50
    const tx = Math.cos(angle) * dist
    const ty = Math.sin(angle) * dist - 20
    return {
      emoji,
      style: `--tx: ${tx.toFixed(1)}rpx; --ty: ${ty.toFixed(1)}rpx; animation-delay: ${(i * 0.05).toFixed(2)}s;`,
    }
  })
}

module.exports = {
  getTodayDateKey,
  isCheckedInToday,
  getCheckInCount,
  addTodayCheckIn,
  buildConfettiBurst,
}
