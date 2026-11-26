import { afterEach, describe, expect, it, vi } from 'vitest'

import { joinApiHostingBeta } from './join-api-hosting-beta'

const LOOPS_FORM_URL = 'https://app.loops.so/api/newsletter-form/clksm7aj203tclb0olg1z2xb3'

/** A fetch that answers with `response` and records what it was asked to send. */
const fetchAnswering = (response: () => Promise<Response>) => vi.fn<typeof fetch>(response)

/** The form fields the first request carried. */
const sentFields = (send: ReturnType<typeof fetchAnswering>): Record<string, string> =>
  Object.fromEntries(new URLSearchParams(String(send.mock.calls[0]?.[1]?.body)))

describe('join-api-hosting-beta', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts the email to the Hosting waitlist as an API client sign-up', async () => {
    const send = fetchAnswering(async () => new Response('{"success":true}'))

    const result = await joinApiHostingBeta({ email: 'ada@example.com', fetch: send })

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
      client: 'true',
    })
  })

  it('sends the framework when one was picked', async () => {
    const send = fetchAnswering(async () => new Response('{"success":true}'))

    await joinApiHostingBeta({ email: 'ada@example.com', framework: 'Hono', fetch: send })

    expect(sentFields(send)).toMatchObject({ email: 'ada@example.com', framework: 'Hono' })
  })

  it('uses the browser fetch when the app brings none of its own', async () => {
    const send = fetchAnswering(async () => new Response('{"success":true}'))
    vi.stubGlobal('fetch', send)

    const result = await joinApiHostingBeta({ email: 'ada@example.com' })

    expect(result.ok).toBe(true)
    expect(send).toHaveBeenCalledOnce()
  })

  it('passes on the message Loops refuses a sign-up with', async () => {
    const send = fetchAnswering(
      async () => new Response('{"success":false,"message":" Invalid email address. "}', { status: 400 }),
    )

    const result = await joinApiHostingBeta({ email: 'ada@example', fetch: send })

    expect(result).toMatchObject({ ok: false, error: 'Invalid email address.' })
  })

  it('explains a refusal that comes without a message', async () => {
    const send = fetchAnswering(async () => new Response('Bad gateway', { status: 502 }))

    const result = await joinApiHostingBeta({ email: 'ada@example.com', fetch: send })

    expect(result).toMatchObject({
      ok: false,
      error: 'The waitlist did not accept this sign-up. Try again in a moment.',
    })
  })

  it('reports a waitlist it cannot reach', async () => {
    const send = fetchAnswering(() => Promise.reject(new TypeError('Failed to fetch')))

    const result = await joinApiHostingBeta({ email: 'ada@example.com', fetch: send })

    expect(result).toMatchObject({
      ok: false,
      error: 'The waitlist could not be reached. Check your connection and try again in a moment.',
    })
  })
})
