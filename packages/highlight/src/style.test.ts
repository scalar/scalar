import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { DEFAULT_PREFIX } from './core/render'
import { SCOPES, scopeClass } from './core/scopes'

const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')

/**
 * The default theme's palette, copied from `@scalar/themes`.
 *
 * Duplicated on purpose: these tests check that our stylesheet stays legible
 * against a known palette. Reading the live package would make the test pass
 * or fail on a dependency bump rather than on a change to this file.
 */
const PALETTE = {
  light: {
    background: '#f6f6f6', // --scalar-background-2
    text: '#1b1b1b', // --scalar-color-1
    green: '#069061',
    red: '#ef0006',
    yellow: '#edbe20',
    blue: '#0082d0',
    orange: '#ff5800',
    purple: '#5203d1',
    accent: '#0099ff',
    '2': '#757575',
    '3': '#8e8e8e',
  },
  dark: {
    background: '#1a1a1a',
    text: '#e7e7e7',
    green: '#00b648',
    red: '#dc1b19',
    yellow: '#ffc90d',
    blue: '#4eb3ec',
    orange: '#ff8d4d',
    purple: '#b191f9',
    accent: '#00aeff',
    '2': '#a4a4a4',
    '3': '#797979',
  },
} as const

// --- color maths -----------------------------------------------------------

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)

const parse = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => toLinear(Number.parseInt(h.slice(i, i + 2), 16) / 255)) as [number, number, number]
}

const toOklab = ([r, g, b]: [number, number, number]): [number, number, number] => {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

const fromOklab = ([L, A, B]: [number, number, number]): [number, number, number] => {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

/** Mirrors `color-mix(in oklab, a <pct>%, b)`. */
const mixOklab = (a: string, b: string, pct: number): [number, number, number] => {
  const [x, y] = [toOklab(parse(a)), toOklab(parse(b))]
  const t = pct / 100
  return fromOklab(x.map((v, i) => v * t + y[i]! * (1 - t)) as [number, number, number])
}

const luminance = ([r, g, b]: [number, number, number]) => 0.2126 * r + 0.7152 * g + 0.0722 * b

const contrast = (fg: [number, number, number], bg: [number, number, number]): number => {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a)
  return (hi! + 0.05) / (lo! + 0.05)
}

// --- extracting what the stylesheet actually declares -----------------------

interface Slot {
  name: string
  hue: string
  pct: number
}

/**
 * Reads the `--scalar-hl-*` declarations out of one mode block, resolving both
 * forms the stylesheet uses: a bare `var(--scalar-color-x)` (100% of the hue)
 * and a `color-mix(... N%, var(--scalar-color-1))`.
 */
const slotsFor = (mode: 'light' | 'dark'): Slot[] => {
  const marker = mode === 'light' ? '.light-mode,' : ':root,'
  const start = css.indexOf(marker)
  expect(start, `could not find the ${mode} block`).not.toBe(-1)
  const block = css.slice(start, css.indexOf('}', start))

  const slots: Slot[] = []
  for (const [, name, value] of block.matchAll(/--scalar-hl-([\w-]+):\s*([^;]+);/g)) {
    const mixed = value!.match(/color-mix\(in oklab,\s*var\(--scalar-color-([\w-]+)\)\s*(\d+)%/)
    if (mixed) {
      slots.push({ name: name!, hue: mixed[1]!, pct: Number(mixed[2]) })
      continue
    }
    const plain = value!.match(/var\(--scalar-color-([\w-]+)\)/)
    if (plain) slots.push({ name: name!, hue: plain[1]!, pct: 100 })
  }
  return slots
}

describe('stylesheet', () => {
  it('declares the same slots in both modes it overrides', () => {
    const light = new Set(slotsFor('light').map((s) => s.name))
    for (const slot of slotsFor('dark')) {
      expect(slot.name.length, 'slot must be named').toBeGreaterThan(0)
    }
    // Light only overrides the slots that need correcting; every one it does
    // override must exist in the base block.
    const base = new Set(slotsFor('dark').map((s) => s.name))
    for (const name of light) {
      expect(base.has(name), `light mode overrides "${name}", which the base block never defines`).toBeTruthy()
    }
  })

  it('styles every scope the grammars can emit', () => {
    const missing = Object.keys(SCOPES).filter((scope) => {
      const cls = `${DEFAULT_PREFIX}${scopeClass(scope)}`
      return !css.includes(`.${cls} `) && !css.includes(`.${cls},`) && !css.includes(`.${cls}{`)
    })
    // `variable` and `variable.member` inherit the block foreground by design.
    expect(missing).toEqual(['variable', 'variable.member'])
  })

  it('uses only --scalar-* custom properties for color', () => {
    // A literal color here would not follow the app's theme preset.
    const literals = [...css.matchAll(/(?:^|[\s:])(#[0-9a-fA-F]{3,8})\b/g)].map((m) => m[1])
    expect(literals, `stylesheet hard-codes ${literals.join(', ')}`).toEqual([])
  })

  for (const mode of ['light', 'dark'] as const) {
    describe(`${mode} mode`, () => {
      const palette = PALETTE[mode]
      const bg = parse(palette.background)

      // Light only overrides some slots; the rest fall through to the base.
      const base = new Map(slotsFor('dark').map((s) => [s.name, s]))
      const resolved = new Map(base)
      if (mode === 'light') for (const s of slotsFor('light')) resolved.set(s.name, s)

      for (const [name, slot] of resolved) {
        // Structural glyphs are held to the 3:1 non-text bar instead. Raising
        // them to 4.5:1 would make them as loud as the code they punctuate.
        const floor = name === 'punctuation' ? 3 : 4.5
        it(`${name} clears ${floor}:1 against --scalar-background-2`, () => {
          const hue = (palette as Record<string, string>)[slot.hue]
          // `expect` does not narrow the way `assert.ok` did, so the non-null
          // assertions below lean on this check rather than on the type.
          expect(hue, `unknown palette entry --scalar-color-${slot.hue}`).toBeDefined()
          const color = slot.pct === 100 ? parse(hue!) : mixOklab(hue!, palette.text, slot.pct)
          const ratio = contrast(color, bg)
          expect(
            ratio,
            `--scalar-hl-${name} resolves to ${ratio.toFixed(2)}:1 (needs ${floor}:1). ` +
              `Lower the color-mix percentage for --scalar-color-${slot.hue} in the ${mode} block.`,
          ).toBeGreaterThanOrEqual(floor)
        })
      }

      it('keeps the grey tiers ordered dimmest to brightest', () => {
        const ratio = (name: string) => {
          const slot = resolved.get(name)!
          const hue = (palette as Record<string, string>)[slot.hue]!
          return contrast(slot.pct === 100 ? parse(hue) : mixOklab(hue, palette.text, slot.pct), bg)
        }
        const tiers = ['punctuation', 'comment', 'muted', 'doc'].map((n) => [n, ratio(n)] as const)
        for (let i = 1; i < tiers.length; i++) {
          expect(
            tiers[i]![1],
            `${tiers[i]![0]} (${tiers[i]![1].toFixed(2)}:1) must read brighter than ` +
              `${tiers[i - 1]![0]} (${tiers[i - 1]![1].toFixed(2)}:1)`,
          ).toBeGreaterThan(tiers[i - 1]![1])
        }
      })
    })
  }
})
