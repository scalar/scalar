import { type Result, err, ok } from '@scalar/helpers/types/result'

/**
 * The Loops newsletter form behind the API Hosting waitlist. The API Hosting page on scalar.com and
 * the API reference's Deploy card post to it too, under the same `Hosting` user group, so every
 * sign-up lands in one list whichever place it came from. Each place also sets a boolean contact
 * property of its own (`landing`, `oss`, and `client` here), so the list can be split by where
 * people joined.
 */
const LOOPS_FORM_URL = 'https://app.loops.so/api/newsletter-form/clksm7aj203tclb0olg1z2xb3'

/** A sign-up that never answers is reported rather than left spinning. */
const TIMEOUT_MS = 15_000

/**
 * Adds an email to the API Hosting waitlist. On failure the error is the message to show: Loops'
 * own when it sends one.
 *
 * Loops keeps any extra field as a contact property of the same name, so `client` marks the
 * sign-up as made in the API client, and the framework goes along as `framework` when one was
 * picked, as it does from the other sign-ups.
 */
export const joinApiHostingBeta = async ({
  email,
  framework,
  fetch: sendRequest = fetch,
}: {
  email: string
  framework?: string
  /**
   * Sends the sign-up. The desktop app passes the fetch that runs in its main process, because the
   * renderer's content security policy does not let it reach Loops.
   */
  fetch?: typeof fetch
}): Promise<Result<undefined>> => {
  const body = new URLSearchParams({
    userGroup: 'Hosting',
    mailingLists: '',
    email,
    client: 'true',
  })
  if (framework) {
    body.set('framework', framework)
  }

  // Loops sits behind Cloudflare, which turns a burst of sign-ups away without the CORS headers a
  // browser needs to read the answer, so being blocked looks the same as being offline.
  const response = await sendRequest(LOOPS_FORM_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch(() => null)

  if (!response) {
    return err('The waitlist could not be reached. Check your connection and try again in a moment.')
  }
  if (response.ok) {
    return ok(undefined)
  }

  const data: unknown = await response.json().catch(() => null)
  const message =
    data && typeof data === 'object' && 'message' in data && typeof data.message === 'string' ? data.message.trim() : ''

  return err(message || 'The waitlist did not accept this sign-up. Try again in a moment.')
}
