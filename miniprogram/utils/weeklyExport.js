const CANVAS_WIDTH = 750
const PADDING = 40
const { calcShoppingCategoriesHeight, calcDayMealsHeight } = require('./weeklyHelper')
const CONTENT_WIDTH = CANVAS_WIDTH - PADDING * 2
const MAX_CANVAS_SIZE = 4096

const COLORS = {
  bg: '#FFFBF8',
  card: '#FFFFFF',
  primary: '#FF6B6B',
  primaryLight: '#FFF0ED',
  text: '#333333',
  text2: '#888888',
  line: '#F2EBE6',
  mint: '#3A8A78',
  mintBg: '#EDFAF6',
}

const SHOP_COLS = 3
const SHOP_CHIP_H = 40
const SHOP_CHIP_GAP = 12

const DISH_NAME_WIDTH = 200
const DISH_CARD_PAD = 14
const DISH_CARD_GAP = 12
const DISH_DETAIL_LINE_H = 28
const DISH_RAIL_W = 4

function calcShoppingRows(count) {
  if (!count) return 0
  return Math.ceil(count / SHOP_COLS)
}

function calcShoppingBlockHeight(categories) {
  return calcShoppingCategoriesHeight(categories)
}

function drawShoppingCategories(ctx, categories, innerX, startY, contentWidth) {
  let y = startY
  categories.forEach((cat) => {
    ctx.fillStyle = COLORS.text
    ctx.font = 'bold 24px sans-serif'
    ctx.fillText(`${cat.emoji} ${cat.label}`, innerX, y)
    ctx.fillStyle = COLORS.text2
    ctx.font = '20px sans-serif'
    ctx.fillText(`${cat.items.length}项`, innerX + contentWidth - 48, y)
    y += 32
    y = drawShoppingGrid(ctx, cat.items, innerX, y, contentWidth) + 12
  })
  return y
}

function drawShoppingGrid(ctx, items, innerX, startY, contentWidth) {
  const chipW = (contentWidth - (SHOP_COLS - 1) * SHOP_CHIP_GAP) / SHOP_COLS
  let x = innerX
  let y = startY
  let col = 0

  items.forEach((item) => {
    fillRoundRect(ctx, x, y, chipW, SHOP_CHIP_H, 18, COLORS.primaryLight)

    let label = String(item)
    ctx.font = '22px sans-serif'
    while (ctx.measureText(label).width > chipW - 20 && label.length > 1) {
      label = label.slice(0, -1)
    }
    if (label !== String(item)) label += '…'

    ctx.fillStyle = COLORS.text
    ctx.textAlign = 'center'
    ctx.fillText(label, x + chipW / 2, y + 26)
    ctx.textAlign = 'left'

    col += 1
    if (col >= SHOP_COLS) {
      col = 0
      x = innerX
      y += SHOP_CHIP_H + SHOP_CHIP_GAP
    } else {
      x += chipW + SHOP_CHIP_GAP
    }
  })

  return y + (col > 0 ? SHOP_CHIP_H : 0)
}

function lineCount(text, charsPerLine) {
  const value = String(text || '').trim()
  if (!value) return 1
  return Math.max(1, Math.ceil(value.length / charsPerLine))
}

function calcPosterHeight(menu, allergyText) {
  const charsPerLine = 22
  let height = PADDING + 130

  if (allergyText) {
    height += 20 + 56 + lineCount(allergyText, 28) * 34 + 16
  }

  ; (menu.days || []).forEach((day) => {
    const meals = day.meals || []
    height += 20 + 52 + calcDayMealsHeight(meals) + 20
  })

  if (menu.nutrition && menu.nutrition.length) {
    height += 20 + 52 + menu.nutrition.length * 36
  }

  if (menu.shoppingCategories && menu.shoppingCategories.length) {
    height += 20 + calcShoppingBlockHeight(menu.shoppingCategories)
  }

  height += 72 + PADDING
  return height
}

function wrapText(ctx, text, maxWidth) {
  const content = String(text || '').trim()
  if (!content) return ['']

  const lines = []
  let line = ''

  for (let i = 0; i < content.length; i += 1) {
    const test = line + content[i]
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = content[i]
    } else {
      line = test
    }
  }

  if (line) lines.push(line)
  return lines.length ? lines : ['']
}

function fillRoundRect(ctx, x, y, width, height, radius, color) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

function strokeRoundRect(ctx, x, y, width, height, radius, color, lineWidth) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.stroke()
}

function drawDishCard(ctx, dish, x, y, width) {
  const details = dish.details || []
  const innerH = details.length
    ? Math.max(30, details.length * DISH_DETAIL_LINE_H + 8)
    : 30
  const cardH = innerH + DISH_CARD_PAD * 2

  fillRoundRect(ctx, x, y, width, cardH, 10, COLORS.card)
  strokeRoundRect(ctx, x, y, width, cardH, 10, 'rgba(0,0,0,0.06)', 1)

  ctx.textAlign = 'left'
  ctx.font = 'bold 24px sans-serif'
  ctx.fillStyle = COLORS.text
  const nameY = y + DISH_CARD_PAD + innerH / 2 + 8
  ctx.fillText(dish.name, x + DISH_CARD_PAD, nameY)

  if (details.length) {
    const bodyX = x + DISH_NAME_WIDTH + 6
    const railX = bodyX
    const railTop = y + DISH_CARD_PAD + 4
    const railBottom = y + cardH - DISH_CARD_PAD - 4
    const grd = ctx.createLinearGradient(railX, railTop, railX, railBottom)
    grd.addColorStop(0, '#FFB8CC')
    grd.addColorStop(1, '#FFE0EA')
    ctx.fillStyle = grd
    ctx.fillRect(railX, railTop, DISH_RAIL_W, railBottom - railTop)

    let detailY = y + DISH_CARD_PAD + 20
    details.forEach((detail) => {
      ctx.fillStyle = '#FFE0EA'
      ctx.fillRect(railX + DISH_RAIL_W, detailY - 10, 12, 4)
      ctx.fillStyle = COLORS.text2
      ctx.font = '22px sans-serif'
      ctx.fillText(detail, bodyX + DISH_RAIL_W + 14, detailY)
      detailY += DISH_DETAIL_LINE_H
    })
  }

  return y + cardH + DISH_CARD_GAP
}

function drawTextLines(ctx, lines, x, startY, lineHeight, color, font) {
  ctx.fillStyle = color
  ctx.font = font
  let y = startY
  lines.forEach((line) => {
    ctx.fillText(line, x, y)
    y += lineHeight
  })
  return y
}

function drawSectionTitle(ctx, title, x, y) {
  ctx.fillStyle = COLORS.primary
  ctx.font = 'bold 30px sans-serif'
  ctx.fillText(title, x, y)
  return y + 40
}

function drawPoster(ctx, data) {
  const { menu, profile, allergyText } = data
  const width = CANVAS_WIDTH
  const height = calcPosterHeight(menu, allergyText)
  const innerX = PADDING + 28
  const textWidth = CONTENT_WIDTH - 56

  ctx.fillStyle = COLORS.bg
  ctx.fillRect(0, 0, width, height)

  let y = PADDING

  fillRoundRect(ctx, PADDING, y, CONTENT_WIDTH, 110, 24, COLORS.primaryLight)
  ctx.fillStyle = COLORS.primary
  ctx.font = 'bold 40px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('宝宝一周菜单', width / 2, y + 48)
  ctx.fillStyle = COLORS.text2
  ctx.font = '24px sans-serif'
  const babyName = profile.name || '宝宝'
  const babyAge = profile.ageMonths ? `${profile.ageMonths}个月` : ''
  ctx.fillText(`${babyName}${babyAge ? ` · ${babyAge}` : ''}`, width / 2, y + 86)
  ctx.textAlign = 'left'
  y += 130

  if (allergyText) {
    y += 20
    const allergyLines = wrapText(ctx, allergyText, textWidth)
    const allergyBlockH = 56 + allergyLines.length * 34
    fillRoundRect(ctx, PADDING, y, CONTENT_WIDTH, allergyBlockH, 20, '#FFF8E8')
    ctx.fillStyle = '#D48806'
    ctx.font = 'bold 24px sans-serif'
    ctx.fillText('⚠️ 过敏注意', innerX, y + 36)
    y = drawTextLines(ctx, allergyLines, innerX, y + 68, 34, '#B88230', '24px sans-serif')
    y += 16
  }

  ; (menu.days || []).forEach((day) => {
    const meals = day.meals || []
    const dayContentHeight = calcDayMealsHeight(meals)
    const blockHeight = 52 + dayContentHeight + 20

    y += 20
    fillRoundRect(ctx, PADDING, y, CONTENT_WIDTH, blockHeight, 20, COLORS.card)

    let cursorY = drawSectionTitle(ctx, day.day || '菜单', innerX, y + 42)

    meals.forEach((meal) => {
      ctx.fillStyle = COLORS.text
      ctx.font = 'bold 26px sans-serif'
      ctx.fillText(`${meal.icon} ${meal.label}`, innerX, cursorY)
      cursorY += 34

        ; (meal.dishes || []).forEach((dish) => {
          cursorY = drawDishCard(ctx, dish, innerX, cursorY, textWidth)
        })

      cursorY += 10
    })

    y += blockHeight
  })

  if (menu.nutrition && menu.nutrition.length) {
    const blockHeight = 52 + menu.nutrition.length * 36
    y += 20
    fillRoundRect(ctx, PADDING, y, CONTENT_WIDTH, blockHeight, 20, COLORS.mintBg)
    y = drawSectionTitle(ctx, '💪 营养亮点', innerX, y + 42)
    menu.nutrition.forEach((item) => {
      ctx.fillStyle = COLORS.mint
      ctx.font = '26px sans-serif'
      ctx.fillText(`✔ ${item}`, innerX, y)
      y += 36
    })
    y += 8
  }

  if (menu.shoppingCategories && menu.shoppingCategories.length) {
    const blockHeight = calcShoppingBlockHeight(menu.shoppingCategories)
    y += 20
    fillRoundRect(ctx, PADDING, y, CONTENT_WIDTH, blockHeight, 20, COLORS.card)
    const gridStartY = drawSectionTitle(ctx, '🛒 采购清单', innerX, y + 42) + 8
    drawShoppingCategories(ctx, menu.shoppingCategories, innerX, gridStartY, textWidth)
    y += blockHeight
  }

  const now = new Date()
  const dateText = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`
  ctx.fillStyle = COLORS.text2
  ctx.font = '22px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`宝贝今天吃什么 · ${dateText}`, width / 2, height - 28)
  ctx.textAlign = 'left'

  return height
}

function getExportMetrics(logicalWidth, logicalHeight, dpr) {
  let exportDpr = dpr || 2
  let physicalWidth = Math.floor(logicalWidth * exportDpr)
  let physicalHeight = Math.floor(logicalHeight * exportDpr)

  if (physicalHeight > MAX_CANVAS_SIZE) {
    exportDpr = MAX_CANVAS_SIZE / logicalHeight
    physicalHeight = MAX_CANVAS_SIZE
    physicalWidth = Math.floor(logicalWidth * exportDpr)
  }

  if (physicalWidth > MAX_CANVAS_SIZE) {
    exportDpr = MAX_CANVAS_SIZE / logicalWidth
    physicalWidth = MAX_CANVAS_SIZE
    physicalHeight = Math.floor(logicalHeight * exportDpr)
  }

  return {
    exportDpr,
    physicalWidth,
    physicalHeight,
  }
}

function waitCanvasReady(canvas) {
  return new Promise((resolve) => {
    if (canvas && typeof canvas.requestAnimationFrame === 'function') {
      canvas.requestAnimationFrame(() => resolve())
      return
    }
    setTimeout(resolve, 200)
  })
}

function canvasToTempFile(canvas, width, height, component) {
  return new Promise((resolve, reject) => {
    const options = {
      canvas,
      x: 0,
      y: 0,
      width,
      height,
      destWidth: width,
      destHeight: height,
      fileType: 'png',
      quality: 1,
      success: (res) => resolve(res.tempFilePath),
      fail: (err) => {
        console.error('[weeklyExport] canvasToTempFilePath fail:', err)
        reject(err)
      },
    }

    if (component) {
      wx.canvasToTempFilePath(options, component)
    } else {
      wx.canvasToTempFilePath(options)
    }
  })
}

function createPosterCanvas(physicalWidth, physicalHeight) {
  if (typeof wx.createOffscreenCanvas === 'function') {
    return wx.createOffscreenCanvas({
      type: '2d',
      width: physicalWidth,
      height: physicalHeight,
    })
  }
  return null
}

function renderWeeklyPoster(data, pageCanvas, component) {
  const menu = data.menu || {}
  const logicalHeight = calcPosterHeight(menu, data.allergyText || '')
  const dpr = wx.getWindowInfo().pixelRatio || 2
  const { exportDpr, physicalWidth, physicalHeight } = getExportMetrics(
    CANVAS_WIDTH,
    logicalHeight,
    dpr
  )

  let canvas = createPosterCanvas(physicalWidth, physicalHeight)
  const useOffscreen = !!canvas

  if (!canvas) {
    canvas = pageCanvas
  }

  if (!canvas) {
    return Promise.reject(new Error('画布初始化失败'))
  }

  if (!useOffscreen) {
    canvas.width = physicalWidth
    canvas.height = physicalHeight
  }

  const ctx = canvas.getContext('2d')
  ctx.scale(exportDpr, exportDpr)
  drawPoster(ctx, data)

  return waitCanvasReady(canvas).then(() =>
    canvasToTempFile(canvas, physicalWidth, physicalHeight, useOffscreen ? null : component)
  )
}

function ensureAlbumPermission() {
  return new Promise((resolve, reject) => {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.writePhotosAlbum']) {
          resolve()
          return
        }
        wx.authorize({
          scope: 'scope.writePhotosAlbum',
          success: resolve,
          fail: () => {
            wx.showModal({
              title: '需要相册权限',
              content: '保存菜单图片需要开启相册权限',
              confirmText: '去设置',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  wx.openSetting({
                    success: (settingRes) => {
                      if (settingRes.authSetting['scope.writePhotosAlbum']) {
                        resolve()
                      } else {
                        reject(new Error('相册权限未开启'))
                      }
                    },
                    fail: reject,
                  })
                } else {
                  reject(new Error('用户拒绝授权'))
                }
              },
            })
          },
        })
      },
      fail: reject,
    })
  })
}

function saveImageToAlbum(filePath) {
  return new Promise((resolve, reject) => {
    wx.saveImageToPhotosAlbum({
      filePath,
      success: resolve,
      fail: reject,
    })
  })
}

module.exports = {
  renderWeeklyPoster,
  ensureAlbumPermission,
  saveImageToAlbum,
}
