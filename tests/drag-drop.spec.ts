import { test, expect } from '@playwright/test'

test.describe('拖拽功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/hand')
    await page.waitForTimeout(2000)
  })

  test('素材区点击添加 - 基线测试', async ({ page }) => {
    const tileGrid = page.locator('.tile-grid')
    await expect(tileGrid).toBeVisible({ timeout: 10000 })

    const sourceTile = page.locator('.tile-grid .tile-item').first()
    await expect(sourceTile).toBeVisible()

    await sourceTile.click()
    await page.waitForTimeout(500)

    const handTiles = page.locator('.tiles-container .tile-wrapper')
    const count = await handTiles.count()
    console.log(`点击添加后手牌区牌数量: ${count}`)

    expect(count).toBeGreaterThan(0)
  })

  test('素材区到手牌区拖拽', async ({ page }) => {
    const tileGrid = page.locator('.tile-grid')
    await expect(tileGrid).toBeVisible({ timeout: 10000 })

    const sourceTile = page.locator('.tile-grid .tile-item').first()
    await expect(sourceTile).toBeVisible()

    const handArea = page.locator('.hand-tiles')
    await expect(handArea).toBeVisible()

    await sourceTile.dragTo(handArea)
    await page.waitForTimeout(1000)

    const handTiles = page.locator('.tiles-container .tile-wrapper')
    const count = await handTiles.count()
    console.log(`拖拽后手牌区牌数量: ${count}`)

    expect(count).toBeGreaterThan(0)
  })

  test('素材区到摸牌区拖拽', async ({ page }) => {
    const tileGrid = page.locator('.tile-grid')
    await expect(tileGrid).toBeVisible({ timeout: 10000 })

    const sourceTile = page.locator('.tile-grid .tile-item').first()
    await expect(sourceTile).toBeVisible()

    const drawZone = page.locator('.draw-tile-zone')
    await expect(drawZone).toBeVisible()

    // 使用 HTML5 drag and drop API
    await page.evaluate(() => {
      const source = document.querySelector('.tile-grid .tile-item') as HTMLElement
      const target = document.querySelector('.draw-tile-zone') as HTMLElement

      if (source && target) {
        const dataTransfer = new DataTransfer()

        source.dispatchEvent(
          new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer })
        )
        target.dispatchEvent(
          new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer })
        )
        target.dispatchEvent(
          new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer })
        )
      }
    })

    await page.waitForTimeout(1000)

    const drawTile = page.locator('.draw-tile')
    const isVisible = await drawTile.isVisible()
    console.log(`摸牌区有牌: ${isVisible}`)

    expect(isVisible).toBe(true)
  })

  test('素材区到牌河拖拽', async ({ page }) => {
    const tileGrid = page.locator('.tile-grid')
    await expect(tileGrid).toBeVisible({ timeout: 10000 })

    const sourceTile = page.locator('.tile-grid .tile-item').first()
    await expect(sourceTile).toBeVisible()

    const riverArea = page.locator('.river-container')
    await expect(riverArea).toBeVisible()

    // 使用 HTML5 drag and drop API
    await page.evaluate(() => {
      const source = document.querySelector('.tile-grid .tile-item') as HTMLElement
      const target = document.querySelector('.river-container') as HTMLElement

      if (source && target) {
        const dataTransfer = new DataTransfer()

        source.dispatchEvent(
          new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer })
        )
        target.dispatchEvent(
          new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer })
        )
        target.dispatchEvent(
          new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer })
        )
      }
    })

    await page.waitForTimeout(1000)

    const riverTiles = page.locator('.river-tile')
    const count = await riverTiles.count()
    console.log(`牌河牌数量: ${count}`)

    expect(count).toBeGreaterThan(0)
  })
})
