<div align="center">

<img src="docs/screenshots/logo.png" width="160" alt="团子食光" />

# 团子食光 · 宝宝辅食小助手

**结合 AI 的婴幼儿辅食推荐微信小程序 —— 照着买、照着做，营养搭配不用愁**

</div>

---

## 📖 简介

「团子食光」是一款面向 **6 个月至 7 岁** 宝宝家长的微信小程序。只需填写宝宝的出生日期，小程序会自动换算当前月龄并匹配对应喂养阶段，再借助 AI 营养师为你生成 **符合月龄质地与安全要求** 的每日餐单、食材搭配、一周菜单，并解答「这个能不能吃」「过敏会有什么症状」等常见喂养问题。

- 🎂 **出生日期驱动**：一次填写生日，所有 AI 推荐都按真实月龄计算，不再手动选年龄
- 🤖 **AI 营养师**：接入 DeepSeek，按 WHO / AAP 辅食指南给出食材形态、调味、克重与做法
- 🎀 **可爱风 UI**：粉色系少女心设计，天窗自定义导航 + 中心搜索按钮
- ☁️ **云端同步**：宝宝档案、过敏原、打卡记录基于微信云开发多端同步

---

## 🖼️ 预览

| 今日推荐 | 食材搭配 | 能不能吃 | 辅食排敏 |
| :---: | :---: | :---: | :---: |
| <img src="docs/screenshots/today.png" width="200" /> | <img src="docs/screenshots/combine.png" width="200" /> | <img src="docs/screenshots/can-eat.png" width="200" /> | <img src="docs/screenshots/desensitize.png" width="200" /> |

---

## ✨ 核心功能

### 🥕 今日（首页）
- 填写宝宝**性别、小名、出生日期**，自动换算月龄（如「1 岁 7 个月」）并匹配喂养阶段
- **今日推荐**：AI 生成一餐 4 种食材，含推荐克重、营养标签、**推荐做法**（蒸/煮/炖）、预计耗时与食材成本
- **随机一天菜单**：一键生成早/中/晚 + 加餐的完整搭配
- **每日打卡**：记录喂养打卡，累计天数带撒花动画
- 顶部每日一句温馨营养建议

### 🥩 搭配
- 勾选家里现有食材（肉类 / 蔬菜 / 蛋奶 / 主食 / 水果 / 豆坚果），AI 智能搭配成营养均衡的一餐
- 给出每餐调味用量与做法，严格贴合当前月龄

### 🔍 能不能吃
- 查询任意食材，判断当前月龄**能不能吃**，给出搭配与做法建议
- 内置 WHO / AAP 参考说明与热门食材快捷查询
- 结果附**雷达图**可视化营养特点

### 🛡️ 辅食排敏
- 按分类（谷物 / 蔬菜 / 水果 / 肉类 / 海鲜 / 蛋奶 / 豆坚果）管理食材尝试进度
- 标记「吃过 / 过敏」，顶部横向卡片汇总各类进度
- **AI 查症状**：点击食材可弹窗查询该食材常见过敏表现，帮助家长及早识别

### 📅 一周
- AI 生成一整周辅食菜单，照着买、照着做
- 营养分析**饼图 + 柱状图**可视化
- 支持导出菜单图片保存到相册

---

## 🛠️ 技术栈

| 分类 | 说明 |
| --- | --- |
| 框架 | 微信小程序原生（Skyline 渲染 / glass-easel，图表页回退 Webview） |
| AI | [DeepSeek](https://www.deepseek.com/) Chat API（`response_format: json_object`） |
| 云能力 | 微信云开发（云数据库存储宝宝档案 `babies` 集合） |
| 图表 | ECharts（`ec-canvas` 组件，雷达图 / 饼图 / 柱状图） |
| 本地存储 | `wx.getStorageSync` 缓存 + 云端同步兜底 |

---

## 📂 目录结构

```
babyEatingToday/
├── app.js / app.json / app.wxss     # 全局入口与配置
├── config/                          # 密钥与云环境配置（需自行创建）
│   ├── ai-secret.example.js         # DeepSeek Key 示例
│   └── cloud.example.js             # 云开发环境 ID 示例
├── pages/
│   ├── index/                       # 今日（首页）
│   ├── combine/                     # 食材搭配
│   ├── can-eat/                     # 能不能吃
│   ├── desensitize/                 # 辅食排敏
│   └── weekly/                      # 一周菜单
├── components/
│   ├── tab-bar/                     # 自定义底部导航
│   ├── ec-canvas/                   # ECharts 画布组件
│   ├── navigation-bar/              # 自定义导航栏
│   └── beam-button/                 # 中心光束按钮
├── utils/
│   ├── ai.js                        # AI 服务层与全部提示词
│   ├── foodData.js                  # 年龄段、月龄换算、本地食谱兜底
│   ├── nutritionHelper.js           # AI 结果归一化与营养估算
│   ├── profileDefaults.js           # 宝宝档案默认值与规范化
│   ├── storage.js / cloudProfile.js # 本地 + 云端档案存储
│   ├── canEatData.js                # 能不能吃本地规则
│   └── ...                          # 打卡、暖心语、图表配置等
└── docs/screenshots/                # 预览截图
```

---

## 🚀 快速开始

### 1. 环境准备
- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 一个微信小程序 AppID（已内置测试 AppID，可替换为自己的）
- 一个 [DeepSeek API Key](https://platform.deepseek.com/)

### 2. 配置密钥
复制示例文件并填入你的信息：

```bash
cp config/ai-secret.example.js config/ai-secret.js
cp config/cloud.example.js config/cloud.js
```

`config/ai-secret.js`：

```js
module.exports = {
  apiKey: 'sk-你的DeepSeekKey',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat',
}
```

`config/cloud.js`：

```js
module.exports = {
  ENV_ID: '你的云开发环境ID',
  PROFILE_COLLECTION: 'babies',
}
```

### 3. 开通云开发
在开发者工具中开通「云开发」，创建数据库集合 `babies`（存储宝宝档案）。

### 4. 运行
用微信开发者工具打开项目根目录，编译预览即可。

> ⚠️ `config/ai-secret.js` 与 `config/cloud.js` 含敏感信息，请勿提交到公开仓库。

---

## 🔑 AI 能力说明

所有 AI 请求都通过 `utils/ai.js` 的 `buildBabyContext` 统一注入宝宝上下文：

```
孩子昵称、性别、当前月龄（由出生日期精确换算）、所属年龄段、
过敏原、不吃的食材、该月龄调味与质地要求
```

据此驱动以下能力：`todayRecommend`（今日推荐）、`randomDayMenu`（随机菜单）、`todaySuggestion`（每日一句建议）、`smartCombine`（食材搭配）、`fridgeMatch`（冰箱搭配）、`weeklyMenu`（一周菜单）、`canEatQuery`（能不能吃）、`allergySymptomsQuery`（过敏症状）。

当 API Key 未配置或调用失败时，会自动回退到本地内置食谱与规则，保证功能可用。

---

## ⚠️ 免责声明

本小程序的所有推荐仅作辅食搭配**参考**，参考 WHO / AAP 通用建议生成，**不能替代医生或专业营养师的诊断意见**。宝宝的过敏、疾病及特殊喂养问题，请务必咨询专业医疗人员。

---

<div align="center">

Made with 💗 for every little 团子

</div>
