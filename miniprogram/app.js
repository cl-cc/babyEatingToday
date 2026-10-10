// app.js
const { setAIConfig, isAIReady } = require('./utils/ai')
const { initCloud } = require('./utils/cloud')
const { loadRecommendRules } = require('./utils/recommendRules')
const { loadCatalogContent } = require('./utils/cms')
const { getProfileReady } = require('./utils/storage')

let aiSecret = {}
try {
  aiSecret = require('./config/ai-secret')
} catch (e) {
  console.warn('未找到 config/ai-secret.js')
}

App({
  onLaunch() {
    initCloud()
    this.globalData.profileReady = getProfileReady()
    loadRecommendRules().catch((err) => {
      console.warn('[cloud] 推荐规则加载失败，使用本地兜底', err)
    })
    loadCatalogContent().catch((err) => {
      console.warn('[cloud] 喂养内容加载失败，使用本地兜底', err)
    })

    setAIConfig(aiSecret)
    if (isAIReady()) {
      console.log('[AI] DeepSeek 已就绪')
    } else {
      console.warn('[AI] API Key 未配置')
    }

    this.globalData.profileReady
      .then((profile) => {
        console.log('[cloud] 用户数据已就绪', {
          name: profile.name,
          ageId: profile.ageId,
          allergies: (profile.allergies || []).length,
          fridge: (profile.fridge || []).length,
          eatenFoods: (profile.eatenFoods || []).length,
        })
      })
      .catch((err) => {
        console.warn('[cloud] 宝宝档案初始化失败', err)
      })
  },
  globalData: {
    userInfo: null,
    profileReady: null,
  },
})
