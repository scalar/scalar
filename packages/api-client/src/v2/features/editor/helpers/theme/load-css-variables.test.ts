import { readdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { loadCssVariables } from './load-css-variables'

type CssVariablesByMode = {
  light: Record<string, string>
  dark: Record<string, string>
}

const HEX_COLOR_REGEX = /^(?:#(?:[0-9A-F]{6}|[0-9A-F]{8}))$/i

const getThemePresetFiles = async (): Promise<Array<{ fileName: string; css: string }>> => {
  const currentDirectory = dirname(fileURLToPath(import.meta.url))
  const presetsDirectory = resolve(currentDirectory, '../../../../../../../themes/src/presets')

  const files = await readdir(presetsDirectory)
  const presetFileNames = files.filter((file) => file.endsWith('.css')).sort()

  const cssFiles = await Promise.all(
    presetFileNames.map(async (fileName) => ({
      fileName,
      css: await readFile(resolve(presetsDirectory, fileName), 'utf-8'),
    })),
  )

  return cssFiles
}

const extractExpectedCssVariables = async (css: string): Promise<CssVariablesByMode> => {
  const sheet = new CSSStyleSheet()
  await sheet.replace(css)

  return Array.from(sheet.cssRules).reduce<CssVariablesByMode>(
    (result, rule) => {
      if (!(rule instanceof CSSStyleRule)) {
        return result
      }

      const variables = Array.from(rule.style).reduce<Record<string, string>>((styles, name) => {
        if (!name.startsWith('--')) {
          return styles
        }

        const value = rule.style.getPropertyValue(name).trim().toUpperCase()

        if (!HEX_COLOR_REGEX.test(value)) {
          return styles
        }

        styles[name] = value

        return styles
      }, {})

      if (rule.selectorText.includes('.light-mode')) {
        result.light = { ...result.light, ...variables }
      }

      if (rule.selectorText.includes('.dark-mode')) {
        result.dark = { ...result.dark, ...variables }
      }

      return result
    },
    { light: {}, dark: {} },
  )
}

describe('load-css-variables', () => {
  it('parses all @scalar/themes presets correctly', async () => {
    const presetFiles = await getThemePresetFiles()

    expect(presetFiles.length).toBe(14)

    for (const preset of presetFiles) {
      const parsedVariables = await loadCssVariables(preset.css)
      const expectedVariables = await extractExpectedCssVariables(preset.css)

      expect(parsedVariables).toStrictEqual(expectedVariables)
      expect(Object.keys(parsedVariables.light).length).toBeGreaterThan(0)
      expect(Object.keys(parsedVariables.dark).length).toBeGreaterThan(0)
    }
  })
})
