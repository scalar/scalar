import { beforeEach, describe, expect, it, vi } from 'vitest'

const getScripts = () =>
  Array.from(document.head.querySelectorAll<HTMLScriptElement>('script[src="https://app.cal.com/embed/embed.js"]'))

describe('cal-embed', () => {
  beforeEach(() => {
    // The loader keeps module state (the stub and the script promise), so every test starts from a fresh module
    vi.resetModules()
    delete window.Cal
    getScripts().forEach((script) => script.remove())
  })

  it('installs the Cal stub, loads the embed script once and queues the booking setup', async () => {
    const { mountCalInline } = await import('./cal-embed')
    const element = document.createElement('div')

    const first = mountCalInline(element, 'light')
    const second = mountCalInline(element, 'dark')

    const scripts = getScripts()
    expect(scripts).toHaveLength(1)
    scripts[0]?.dispatchEvent(new Event('load'))
    await expect(first).resolves.toBeUndefined()
    await expect(second).resolves.toBeUndefined()

    const namespace = window.Cal?.ns?.['30min']
    expect(window.Cal?.q).toContainEqual(['initNamespace', '30min'])
    expect(namespace?.q?.[0]).toEqual(['init', '30min', { origin: 'https://scalar.cal.com' }])
    expect(namespace?.q).toContainEqual([
      'inline',
      {
        elementOrSelector: element,
        config: { layout: 'month_view', useSlotsViewOnSmallScreen: 'true' },
        calLink: 'marc/30min',
      },
    ])
    expect(namespace?.q).toContainEqual(['ui', { hideEventTypeDetails: false, layout: 'month_view', theme: 'light' }])
    expect(namespace?.q).toContainEqual(['ui', { hideEventTypeDetails: false, layout: 'month_view', theme: 'dark' }])
    expect(window.Cal?.config?.forwardQueryParams).toBe(true)
  })

  it('rejects when the embed script fails to load and requests it again on the next attempt', async () => {
    const { mountCalInline } = await import('./cal-embed')
    const element = document.createElement('div')

    const attempt = mountCalInline(element, 'light')
    getScripts()[0]?.dispatchEvent(new Event('error'))
    await expect(attempt).rejects.toThrow('Failed to load the Cal.com embed')
    expect(getScripts()).toHaveLength(0)

    const retry = mountCalInline(element, 'light')
    const scripts = getScripts()
    expect(scripts).toHaveLength(1)
    scripts[0]?.dispatchEvent(new Event('load'))
    await expect(retry).resolves.toBeUndefined()
  })

  it('reuses a Cal that the host page already provides without loading the script', async () => {
    const calls: unknown[][] = []
    const hostNamespace = Object.assign((...args: unknown[]) => calls.push(args), { q: [] })
    window.Cal = Object.assign((...args: unknown[]) => calls.push(args), {
      loaded: true,
      ns: { '30min': hostNamespace },
    })
    const { mountCalInline } = await import('./cal-embed')

    await expect(mountCalInline(document.createElement('div'), 'light')).resolves.toBeUndefined()

    expect(getScripts()).toHaveLength(0)
    expect(calls[0]).toEqual(['init', '30min', { origin: 'https://scalar.cal.com' }])
    expect(calls.some((call) => call[0] === 'inline')).toBe(true)
  })
})
