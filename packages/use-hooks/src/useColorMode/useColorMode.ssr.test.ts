import { describe, expect, it } from 'vitest'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'

import { useColorMode } from './useColorMode'

describe('useColorMode', () => {
  it('defaults to system mode and supports updates without window or document', async () => {
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')

    const app = createSSRApp({
      setup() {
        const { colorMode, darkLightMode, setColorMode, toggleColorMode } = useColorMode()
        expect(colorMode.value).toBe('system')
        expect(darkLightMode.value).toBe('light')
        setColorMode('dark')
        expect(darkLightMode.value).toBe('dark')
        toggleColorMode()
        expect(darkLightMode.value).toBe('light')
        return () => null
      },
    })

    await renderToString(app)
  })

  it('uses system mode during server rendering even with an initial color mode', async () => {
    const app = createSSRApp({
      setup() {
        const { colorMode } = useColorMode({ initialColorMode: 'dark' })
        expect(colorMode.value).toBe('system')
        return () => null
      },
    })

    await renderToString(app)
  })
})
