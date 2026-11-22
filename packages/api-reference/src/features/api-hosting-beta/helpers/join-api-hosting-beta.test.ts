import { afterEach, describe, expect, it, vi } from 'vitest'

import { joinApiHostingBeta } from './join-api-hosting-beta'

const LOOPS_FORM_URL = 'https://app.loops.so/api/newsletter-form/clksm7aj203tclb0olg1z2xb3'

/** Stands in for the browser's fetch, answering with `response`. */
const stubFetch = (response: () => Promise<Response>) => {
  const send = vi.fn<typeof fetch>(response)
  vi.stubGlobal('fetch', send)
  return send
}

/** The form fields the first request carried. */
const sentFields = (send: ReturnType<typeof stubFetch>): Record<string, string> =>
  Object.fromEntries(new URLSearchParams(String(send.mock.calls[0]?.[1]?.body)))

describe('join-api-hosting-beta', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts the email to the Hosting waitlist as an open source sign-up', async () => {
    const send = stubFetch(async () => new Response('{"success":true}'))

    const result = await joinApiHostingBeta({ email: 'ada@example.com' })

    expect(result).toEqual({ ok: true, data: undefined })
    expect(send).toHaveBeenCalledOnce()
    expect(send.mock.calls[0]?.[0]).toBe(LOOPS_FORM_URL)
    expect(send.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    expect(sentFields(send)).toEqual({
      userGroup: 'Hosting',
      mailingLists: '',
      email: 'ada@example.com',
      oss: 'true',
    })
  })

  it('sends the framework when there is one', async () => {
    const send = stubFetch(async () => new Response('{"success":true}'))

    await joinApiHostingBeta({ email: 'ada@example.com', framework: 'FastAPI' })

    expect(sentFields(send)).toMatchObject({ email: 'ada@example.com', framework: 'FastAPI' })
  })

  it('passes on the message Loops refuses a sign-up with', async () => {
    stubFetch(async () => new Response('{"success":false,"message":" Invalid email address. "}', { status: 400 }))

    const result = await joinApiHostingBeta({ email: 'ada@example' })

    expect(result).toMatchObject({ ok: false, error: 'rejected', message: 'Invalid email address.' })
  })

  it('reports a refusal that comes without a message', async () => {
    stubFetch(async () => new Response('Bad gateway', { status: 502 }))

    const result = await joinApiHostingBeta({ email: 'ada@example.com' })

    expect(result).toMatchObject({ ok: false, error: 'rejected', message: undefined })
  })

  it('reports a waitlist it cannot reach', async () => {
    stubFetch(() => Promise.reject(new TypeError('Failed to fetch')))

    const result = await joinApiHostingBeta({ email: 'ada@example.com' })

    expect(result).toMatchObject({ ok: false, error: 'unreachable' })
  })
})
