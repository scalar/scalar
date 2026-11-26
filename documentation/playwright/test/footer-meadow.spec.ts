import { readFileSync } from 'node:fs'

import { expect, test } from '@playwright/test'

const footer = readFileSync(new URL('../../footer.html', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../../assets/styles.css', import.meta.url), 'utf8')
const hero = readFileSync(new URL('../../assets/headless-hero.js', import.meta.url), 'utf8')

for (const { width, bandHeight, uncroppedHeight } of [
  { width: 640, bandHeight: 83, uncroppedHeight: 165 },
  { width: 641, bandHeight: 120, uncroppedHeight: 240 },
]) {
  test(`clips the footer meadow without moving its canvas at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    // Keep the footer beyond the renderer's wake margin. Only layout is needed here.
    await page.setContent(`
      <!doctype html>
      <style>*, ::before, ::after { box-sizing: border-box; } ${styles}</style>
      <main style="height: 5000px"></main>
      ${footer}
    `)
    await page.addScriptTag({ content: hero })

    const band = page.locator('.docs-footer-band')
    const canvas = band.locator('canvas')
    const measure = () =>
      canvas.evaluate(async (element) => {
        // Extend just this observer's viewport so clipping is measured without waking the renderer.
        const visible = await new Promise<DOMRectReadOnly>((resolve) => {
          const observer = new IntersectionObserver(
            ([entry]) => {
              if (entry) {
                observer.disconnect()
                resolve(entry.intersectionRect)
              }
            },
            { rootMargin: '6000px 0px' },
          )
          observer.observe(element)
        })
        const band = element.closest('.docs-footer-band')?.getBoundingClientRect()
        if (!band) {
          throw new Error('The footer canvas is missing its band')
        }

        const canvas = element.getBoundingClientRect()
        return {
          bandHeight: band.height,
          canvasHeight: canvas.height,
          reachAboveBand: band.top - canvas.top,
          clippedHeight: canvas.bottom - visible.bottom,
          clipBottomOffset: visible.bottom - band.bottom,
        }
      })

    const cropped = await measure()
    expect(cropped.bandHeight).toBe(bandHeight)
    expect(cropped.reachAboveBand).toBeGreaterThan(0)
    expect(cropped.clippedHeight).toBe(uncroppedHeight - bandHeight)
    expect(cropped.clipBottomOffset).toBe(0)

    // Recreate the full band to compare the layout before the crop.
    await band.evaluate((element, height) => {
      element.style.height = `${height}px`
      element.style.setProperty('--hl-footer-cut', '0px')
    }, uncroppedHeight)

    await expect.poll(measure).toStrictEqual({
      bandHeight: uncroppedHeight,
      canvasHeight: cropped.canvasHeight,
      reachAboveBand: cropped.reachAboveBand,
      clippedHeight: 0,
      clipBottomOffset: 0,
    })
  })
}
