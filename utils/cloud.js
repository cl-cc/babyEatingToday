const { ENV_ID } = require('../config/cloud')

let inited = false
let db = null

function initCloud() {
  if (inited) return !!db
  if (!wx.cloud) {
    console.warn('[cloud] 当前基础库不支持 wx.cloud')
    return false
  }
  wx.cloud.init({
    env: ENV_ID,
    traceUser: true,
  })
  db = wx.cloud.database()
  inited = true
  console.log('[cloud] 已初始化环境', ENV_ID)
  return true
}

function getDB() {
  if (!initCloud()) return null
  return db
}

function isCloudReady() {
  return initCloud()
}

module.exports = {
  initCloud,
  getDB,
  isCloudReady,
}
