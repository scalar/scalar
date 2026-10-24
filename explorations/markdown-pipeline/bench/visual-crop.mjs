/**
 * Turns each differing screenshot pair from `bench/visual.mjs` into one image
 * of the rows that differ: current on the left, prototype on the right, with a
 * margin of context. Also counts the differing pixels, so pairs can be sorted.
 *
 *   node bench/visual-crop.mjs <label>-<mode>
 */
import { readFileSync, writeFileSync } from 'node:fs'

import { OUT, ROOT } from './paths.mjs'

const [name] = process.argv.slice(2)
const dir = `${OUT}visual/${name}/`
const index = JSON.parse(readFileSync(`${dir}index.json`, 'utf8'))
const { chromium } = await import(`${ROOT}node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs`)
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage()

for (const item of index) {
  const [a, b] = ['current', 'prototype'].map((s) => readFileSync(`${dir}${item.n}-${s}.png`).toString('base64'))
  const result = await page.evaluate(
    async ([a, b]) => {
      const load = (src) =>
        new Promise((resolve) => {
          const img = new Image()
          img.onload = () => resolve(img)
          img.src = `data:image/png;base64,${src}`
        })
      const [ia, ib] = await Promise.all([load(a), load(b)])
      const w = Math.max(ia.width, ib.width)
      const h = Math.max(ia.height, ib.height)
      const pixels = (img) => {
        const c = new OffscreenCanvas(w, h)
        const x = c.getContext('2d')
        x.fillStyle = '#fff'
        x.fillRect(0, 0, w, h)
        x.drawImage(img, 0, 0)
        return x.getImageData(0, 0, w, h).data
      }
      const pa = pixels(ia)
      const pb = pixels(ib)
      let first = -1
      let last = -1
      let count = 0
      for (let y = 0; y < h; y++) {
        let row = false
        for (let i = y * w * 4; i < (y + 1) * w * 4; i += 4) {
          if (pa[i] !== pb[i] || pa[i + 1] !== pb[i + 1] || pa[i + 2] !== pb[i + 2]) {
            row = true
            count++
          }
        }
        if (row) {
          if (first === -1) first = y
          last = y
        }
      }
      // A height change shifts everything below it, so only the start of the band is telling.
      const top = Math.max(0, first - 40)
      const bottom = Math.min(h, Math.min(last, first + 400) + 40)
      const out = new OffscreenCanvas(w * 2 + 12, bottom - top)
      const x = out.getContext('2d')
      x.fillStyle = '#c00'
      x.fillRect(0, 0, out.width, out.height)
      x.drawImage(ia, 0, top, w, bottom - top, 0, 0, w, bottom - top)
      x.drawImage(ib, 0, top, w, bottom - top, w + 12, 0, w, bottom - top)
      const blob = await out.convertToBlob({ type: 'image/png' })
      const bytes = new Uint8Array(await blob.arrayBuffer())
      let s = ''
      for (const byte of bytes) s += String.fromCharCode(byte)
      return { png: btoa(s), count, first, heights: [ia.height, ib.height] }
    },
    [a, b],
  )
  writeFileSync(`${dir}${item.n}-crop.png`, Buffer.from(result.png, 'base64'))
  Object.assign(item, { pixels: result.count, firstRow: result.first, heights: result.heights })
}
await browser.close()
writeFileSync(`${dir}index.json`, JSON.stringify(index, null, 2))
console.log(`${name}: cropped ${index.length} pairs`)
