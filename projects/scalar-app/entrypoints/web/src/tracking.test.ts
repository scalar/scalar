import { beforeEach, describe, expect, it, vi } from 'vitest'

import { initializeWebsiteTrackers } from './tracking'

type TrackingContext = NonNullable<Parameters<typeof initializeWebsiteTrackers>[0]>
type TestTrackingWindow = TrackingContext['targetWindow']

describe('initializeWebsiteTrackers', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
  })

  it('loads Apollo and Vector on client.scalar.com', () => {
    const onLoad = vi.fn()
    const targetWindow = {
      trackingFunctions: { onLoad },
    } as unknown as TestTrackingWindow
    const targetDocument = document.implementation.createHTMLDocument('tracking test')
    const bootstrapScript = targetDocument.createElement('script')
    targetDocument.head.appendChild(bootstrapScript)

    initializeWebsiteTrackers({
      hostname: 'client.scalar.com',
      targetDocument,
      targetWindow,
    })

    const apolloScript = targetDocument.querySelector(
      'script[data-apollo-tracker="client-scalar"]',
    ) as HTMLScriptElement | null
    const vectorScript = targetDocument.querySelector(
      'script[data-vector-tracker="client-scalar"]',
    ) as HTMLScriptElement | null

    expect(apolloScript?.src).toContain('https://assets.apollo.io/micro/website-tracker/tracker.iife.js')
    expect(vectorScript?.src).toBe('https://cdn.vector.co/pixel.js')
    expect(targetWindow.vector?.q).toContainEqual(['load', ['35f38258-8949-4041-a905-81ffb5a51704']])

    apolloScript?.onload?.(new Event('load'))
    expect(onLoad).toHaveBeenCalledWith({ appId: '69af08315b42dc0021c4058a' })
  })

  it('does nothing outside the Apollo tracking host', () => {
    const targetWindow = {} as TestTrackingWindow
    const targetDocument = document.implementation.createHTMLDocument('tracking test')

    initializeWebsiteTrackers({
      hostname: 'example.com',
      targetDocument,
      targetWindow,
    })

    expect(targetDocument.querySelector('script[data-apollo-tracker="client-scalar"]')).toBeNull()
    expect(targetDocument.querySelector('script[data-vector-tracker="client-scalar"]')).toBeNull()
    expect(targetWindow.vector).toBeUndefined()
  })

  it('does not inject duplicate trackers when already initialized', () => {
    const targetWindow = {} as TestTrackingWindow
    const targetDocument = document.implementation.createHTMLDocument('tracking test')
    const bootstrapScript = targetDocument.createElement('script')
    targetDocument.head.appendChild(bootstrapScript)

    initializeWebsiteTrackers({
      hostname: 'client.scalar.com',
      targetDocument,
      targetWindow,
    })
    initializeWebsiteTrackers({
      hostname: 'client.scalar.com',
      targetDocument,
      targetWindow,
    })

    expect(targetDocument.querySelectorAll('script[data-apollo-tracker="client-scalar"]')).toHaveLength(1)
    expect(targetDocument.querySelectorAll('script[data-vector-tracker="client-scalar"]')).toHaveLength(1)
    expect(targetWindow.vector?.q.filter(([method]) => method === 'load')).toHaveLength(1)
  })
})
