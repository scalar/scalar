import { readFileSync } from 'node:fs'

import { expect, test } from '@playwright/test'
import { ModuleKind, ScriptTarget, transpileModule } from 'typescript'

// Run the actual helper in the browser without depending on the gallery or a copied implementation.
const source = readFileSync(new URL('./findScrollContainer.ts', import.meta.url), 'utf8')
const { outputText } = transpileModule(source, {
  compilerOptions: { module: ModuleKind.ESNext, target: ScriptTarget.ESNext },
})
const moduleUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`

// jsdom 30 returns visible overflow axes for an auto/scroll shorthand. These cases
// need a browser's computed styles, including the coupling between the two axes.
test.describe('findScrollContainer', () => {
  for (const { name, styles, direction = 'y' as const, expected } of [
    { name: 'falls back when no parent scrolls', styles: [''], expected: 'root' },
    { name: 'finds overflow auto', styles: ['overflow: auto'], expected: 'parent-0' },
    { name: 'finds overflow scroll', styles: ['overflow: scroll'], expected: 'parent-0' },
    {
      name: 'finds the nearest scrollable ancestor',
      styles: ['overflow: auto', 'overflow: scroll'],
      expected: 'parent-1',
    },
    {
      name: 'skips non-scrollable ancestors',
      styles: ['overflow: auto', 'overflow: visible'],
      expected: 'parent-0',
    },
    { name: 'finds vertical overflow', styles: ['overflow-y: auto'], expected: 'parent-0' },
    { name: 'finds horizontal overflow', styles: ['overflow-x: auto'], direction: 'x', expected: 'parent-0' },
    { name: 'ignores a clipped vertical axis', styles: ['overflow: scroll hidden'], expected: 'root' },
    {
      name: 'ignores a clipped horizontal axis',
      styles: ['overflow: hidden scroll'],
      direction: 'x',
      expected: 'root',
    },
    {
      name: 'expands a single shorthand value horizontally',
      styles: ['overflow: auto'],
      direction: 'x',
      expected: 'parent-0',
    },
    {
      name: 'expands two shorthand values horizontally',
      styles: ['overflow: auto scroll'],
      direction: 'x',
      expected: 'parent-0',
    },
    { name: 'expands two shorthand values vertically', styles: ['overflow: auto scroll'], expected: 'parent-0' },
    {
      name: 'computes visible as auto beside a scroll axis',
      styles: ['overflow: scroll visible'],
      expected: 'parent-0',
    },
    { name: 'handles deep nesting', styles: ['overflow: auto', ...Array<string>(10).fill('')], expected: 'parent-0' },
    { name: 'ignores hidden overflow', styles: ['overflow: hidden'], expected: 'root' },
  ] satisfies { name: string; styles: string[]; direction?: 'x' | 'y'; expected: string }[]) {
    test(name, async ({ page }) => {
      const result = await page.evaluate(
        async ({ moduleUrl, styles, direction }) => {
          const { findScrollContainer } = (await import(moduleUrl)) as typeof import('./findScrollContainer')
          document.documentElement.id = 'root'
          let parent: HTMLElement = document.body
          for (const [index, style] of styles.entries()) {
            const element = document.createElement('div')
            element.id = `parent-${index}`
            element.style.cssText = style
            parent.appendChild(element)
            parent = element
          }
          const child = document.createElement('div')
          parent.appendChild(child)
          return findScrollContainer(child, direction).id
        },
        { moduleUrl, styles, direction },
      )
      expect(result).toBe(expected)
    })
  }

  test('falls back for missing or detached elements', async ({ page }) => {
    const result = await page.evaluate(async (moduleUrl) => {
      const { findScrollContainer } = (await import(moduleUrl)) as typeof import('./findScrollContainer')
      document.documentElement.id = 'root'
      return [undefined, null, document.createElement('div')].map((element) => findScrollContainer(element).id)
    }, moduleUrl)
    expect(result).toEqual(['root', 'root', 'root'])
  })
})
