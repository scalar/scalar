import { presets } from '@scalar/themes'
import { describe, expect, it } from 'vitest'

import { loadCssVariables } from './load-css-variables'

/**
 * Text contrast pins for the shipped theme presets.
 *
 * An accessibility audit found several presets whose muted text and code-string
 * blue fell under the 4.5:1 WCAG 1.4.3 asks of body text on the very surfaces
 * those presets paint. The palettes were nudged; this locks the result in so a
 * future palette edit cannot quietly drop back under the line.
 *
 * The maths lives here rather than in a shared helper for the same reason
 * `@scalar/highlight`'s style test keeps its own copy: the numbers are the thing
 * under test, so they should not be able to move with a dependency.
 */

type Mode = 'light' | 'dark'

/** The pairs of foreground and background tokens that carry body text. */
const PAIRS = [
  {
    /** Secondary text, on the page itself. */
    mode: 'light' as Mode,
    foreground: '--scalar-color-2',
    background: '--scalar-background-1',
  },
  {
    /**
     * The same secondary text on the raised surface: cards, the classic layout's
     * accordions and the message cards all paint background-2 behind it.
     */
    mode: 'light' as Mode,
    foreground: '--scalar-color-2',
    background: '--scalar-background-2',
  },
  {
    /** Code strings and symbols, which render on the grey example surface. */
    mode: 'light' as Mode,
    foreground: '--scalar-color-blue',
    background: '--scalar-background-2',
  },
  {
    mode: 'dark' as Mode,
    foreground: '--scalar-color-blue',
    background: '--scalar-background-2',
  },
] as const

/**
 * Pairs that are still short of 4.5:1 and are deliberately left alone.
 *
 * Laserwave's light mode reuses the dark palette's accents unchanged, so its blue
 * (2.21:1), green, red and yellow all miss by a wide margin. Bringing them up is a
 * redesign of the preset's identity rather than the hue-preserving nudge the other
 * presets needed, so it wants a design decision of its own.
 */
const KNOWN_SHORTFALLS = new Set(['laserwave light --scalar-color-blue on --scalar-background-2'])

const toLinear = (channel: number): number =>
  channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4

/** Channel triples in the 0-255 range, plus the alpha the token declared. */
const parse = (hex: string): { channels: [number, number, number]; alpha: number } => {
  const value = hex.replace('#', '')
  const channels = [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16)) as [
    number,
    number,
    number,
  ]
  const alpha = value.length === 8 ? Number.parseInt(value.slice(6, 8), 16) / 255 : 1
  return { channels, alpha }
}

/** Flattens a translucent token onto whatever it is painted over. */
const composite = (hex: string, base: [number, number, number]): [number, number, number] => {
  const { channels, alpha } = parse(hex)
  return channels.map((channel, index) => channel * alpha + base[index]! * (1 - alpha)) as [number, number, number]
}

const luminance = ([red, green, blue]: [number, number, number]): number =>
  0.2126 * toLinear(red / 255) + 0.7152 * toLinear(green / 255) + 0.0722 * toLinear(blue / 255)

const contrast = (foreground: [number, number, number], background: [number, number, number]): number => {
  const [high, low] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (high! + 0.05) / (low! + 0.05)
}

type PresetId = keyof typeof presets
const presetIds = Object.keys(presets) as PresetId[]

describe('preset-contrast', () => {
  it.each(presetIds)('%s keeps body text at 4.5:1 or better on its own surfaces', async (id) => {
    const variables = await loadCssVariables(presets[id].theme)

    for (const pair of PAIRS) {
      const palette = variables[pair.mode]
      const foreground = palette[pair.foreground]
      const background = palette[pair.background]

      // A preset that does not declare the pair inherits the default, which passes.
      if (!foreground || !background) {
        continue
      }

      // The page background is the backstop for any token that carries alpha.
      const page = parse(palette['--scalar-background-1'] ?? background).channels
      const ratio = contrast(composite(foreground, page), composite(background, page))
      const key = `${id} ${pair.mode} ${pair.foreground} on ${pair.background}`

      if (KNOWN_SHORTFALLS.has(key)) {
        expect(ratio, `${key} unexpectedly passes — drop it from KNOWN_SHORTFALLS`).toBeLessThan(4.5)
        continue
      }

      expect(ratio, key).toBeGreaterThanOrEqual(4.5)
    }
  })
})
