import { expect, test } from '@playwright/test'
// Use the built library on the server, as Nuxt consumers do. Its client-compiled
// render functions must produce the same styles as the browser, without useCssVars.
import { ScalarIcon } from '@scalar/components/icon'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'

import type { ScalarIconProps } from './types'

for (const { name, props } of [
  { name: 'default thickness', props: { icon: 'programming-language-shell' } },
  { name: 'custom thickness', props: { icon: 'Add', thickness: '3' } },
  { name: 'logo', props: { icon: undefined, logo: 'Nuxt', thickness: '1' } },
] satisfies { name: string; props: ScalarIconProps }[]) {
  test(`hydrates an icon with ${name} without changing its styles`, async ({ page }, testInfo) => {
    const iconProps = { ...props, size: 'lg', label: 'Hydrated icon' } satisfies ScalarIconProps
    const html = await renderToString(createSSRApp({ render: () => h(ScalarIcon, iconProps) }))
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (/hydration/i.test(message.text())) {
        errors.push(message.text())
      }
    })

    await page.goto('/hydration.html')
    await page.evaluate((html) => {
      const root = document.querySelector('#root')
      if (!root) {
        throw new Error('Gallery root is missing')
      }
      root.innerHTML = html
    }, html)
    const icon = page.getByLabel('Hydrated icon')
    const serverIcon = await icon.elementHandle()
    const serverStyle = await icon.getAttribute('style')
    await testInfo.attach('before-hydration', { body: await icon.screenshot(), contentType: 'image/png' })

    await page.evaluate((props) => window.hydrateIcon(props), iconProps)

    expect(await serverIcon?.evaluate((element) => element.isConnected)).toBe(true)
    expect(await icon.getAttribute('style')).toBe(serverStyle)
    const strokeWidths = await icon.evaluate((element) => [
      getComputedStyle(element).strokeWidth,
      getComputedStyle(element.querySelector('path') ?? element).strokeWidth,
    ])
    const expectedWidth = `${props.thickness ?? '2'}px`
    expect(strokeWidths).toStrictEqual([expectedWidth, expectedWidth])
    expect(errors).toStrictEqual([])
    await testInfo.attach('after-hydration', { body: await icon.screenshot(), contentType: 'image/png' })
  })
}
