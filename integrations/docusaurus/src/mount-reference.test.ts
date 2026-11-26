// @vitest-environment jsdom
// @vitest-environment-options {"jsdom":{"runScripts":"dangerously"}}

import type { ApiReferenceInstance, CreateApiReference } from '@scalar/types/api-reference'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const releaseUnusedStyles = vi.fn()

const cdn = 'https://example.com/scalar.js'
const createReference = vi.fn<CreateApiReference>(() => ({ destroy: vi.fn() }) as unknown as ApiReferenceInstance)

const finishDownload = (): void => {
  const script = document.querySelector<HTMLScriptElement>('script[src]')
  expect(script?.src).toBe(cdn)
  script?.dispatchEvent(new Event('load'))
}

const flush = async (): Promise<void> => {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

describe('mount-reference', () => {
  beforeEach(() => {
    vi.resetModules()
    createReference.mockClear()
    releaseUnusedStyles.mockClear()
    vi.stubGlobal('Scalar', { createApiReference: createReference, releaseUnusedStyles })
  })

  afterEach(() => {
    document.head.replaceChildren()
    document.body.replaceChildren()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('loads lazily and destroys the reference when leaving the route', async () => {
    const { mountReference } = await import('./mount-reference.js')
    expect(document.querySelector('script')).toBeNull()
    const container = document.createElement('div')
    const cleanup = mountReference(container, '{ theme: "purple" }', cdn)
    expect(createReference).not.toHaveBeenCalled()

    finishDownload()
    await flush()
    expect(createReference.mock.calls).toEqual([[container, { theme: 'purple' }]])
    expect(document.querySelector('script')).toBeNull()
    cleanup()
    cleanup()
    expect(createReference.mock.results[0]?.value.destroy).toHaveBeenCalledTimes(1)
  })

  it('preserves function-valued configuration without eval', async () => {
    const { mountReference } = await import('./mount-reference.js')
    const cleanup = mountReference(document.createElement('div'), '{ onBeforeRequest: () => "callback" }', cdn)
    finishDownload()
    await flush()

    const configuration = createReference.mock.calls[0]?.[1] as unknown as { onBeforeRequest: () => string }
    expect(configuration.onBeforeRequest()).toBe('callback')
    cleanup()
  })

  it('shares one download between mounts and destroys each instance independently', async () => {
    const { mountReference } = await import('./mount-reference.js')
    const first = mountReference(document.createElement('div'), '{}', cdn)
    const second = mountReference(document.createElement('div'), '{}', cdn)
    expect(document.querySelectorAll('script[src]').length).toBe(1)
    finishDownload()
    await flush()
    expect(createReference).toHaveBeenCalledTimes(2)

    first()
    expect(createReference.mock.results[0]?.value.destroy).toHaveBeenCalledTimes(1)
    expect(createReference.mock.results[1]?.value.destroy).not.toHaveBeenCalled()
    second()
    expect(createReference.mock.results[1]?.value.destroy).toHaveBeenCalledTimes(1)
  })

  it('reuses the loaded factory on subsequent visits', async () => {
    const { mountReference } = await import('./mount-reference.js')
    const first = mountReference(document.createElement('div'), '{}', cdn)
    finishDownload()
    await flush()
    first()

    const second = mountReference(document.createElement('div'), '{}', cdn)
    await flush()
    expect(document.querySelector('script[src]')).toBeNull()
    expect(createReference).toHaveBeenCalledTimes(2)
    second()
    expect(createReference.mock.results[1]?.value.destroy).toHaveBeenCalledTimes(1)
  })

  it('releases late-arriving styles without executing abandoned configuration', async () => {
    const { mountReference } = await import('./mount-reference.js')
    const container = document.createElement('div')
    const cleanup = mountReference(container, '(() => { throw new Error("abandoned") })()', cdn)
    cleanup()
    finishDownload()
    await flush()

    expect(createReference).not.toHaveBeenCalled()
    expect(releaseUnusedStyles).toHaveBeenCalledTimes(1)
  })

  it('keeps a concurrent active mount alive when another mount leaves during download', async () => {
    const { mountReference } = await import('./mount-reference.js')
    const abandoned = mountReference(document.createElement('div'), '{}', cdn)
    const active = mountReference(document.createElement('div'), '{}', cdn)
    abandoned()
    finishDownload()
    await flush()
    expect(createReference).toHaveBeenCalledTimes(1)
    expect(createReference.mock.results[0]?.value.destroy).not.toHaveBeenCalled()
    expect(releaseUnusedStyles).toHaveBeenCalledTimes(1)
    active()
  })

  it('releases bundle styles when cleanup precedes deferred plugin mounting', async () => {
    const { mountReference } = await import('./mount-reference.js')
    const style = document.createElement('style')
    style.id = 'scalar-style'
    document.head.appendChild(style)
    const cleanup = mountReference(
      document.createElement('div'),
      '{ pluginUrls: ["https://example.com/plugin.js"] }',
      cdn,
    )
    finishDownload()
    await flush()

    cleanup()
    expect(createReference.mock.results[0]?.value.destroy).toHaveBeenCalledTimes(1)
    expect(createReference).toHaveBeenCalledTimes(1)
    expect(releaseUnusedStyles).toHaveBeenCalledTimes(1)
  })

  it('supports older CDN bundles without the style cleanup helper', async () => {
    vi.stubGlobal('Scalar', { createApiReference: createReference })
    const { mountReference } = await import('./mount-reference.js')
    const cleanup = mountReference(document.createElement('div'), '{}', cdn)
    finishDownload()
    await flush()
    cleanup()
    expect(createReference).toHaveBeenCalledTimes(1)
    expect(createReference.mock.results[0]?.value.destroy).toHaveBeenCalledTimes(1)
  })

  it('reports download failures and retries on the next visit', async () => {
    const { mountReference } = await import('./mount-reference.js')
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const first = mountReference(document.createElement('div'), '{}', cdn)
    document.querySelector('script[src]')?.dispatchEvent(new Event('error'))
    await flush()
    expect(error).toHaveBeenCalledWith(new Error(`Unable to load Scalar from ${cdn}`))
    expect(createReference).not.toHaveBeenCalled()
    first()

    const second = mountReference(document.createElement('div'), '{}', cdn)
    finishDownload()
    await flush()
    expect(createReference).toHaveBeenCalledTimes(1)
    second()
  })
})
