import { type Result, err, ok } from '@scalar/helpers/types/result'

/**
 * The Loops newsletter form behind the API Hosting waitlist. The API Hosting page on scalar.com, the
 * API client and the Deploy panel post to it too, under the same `Hosting` user group, so every
 * sign-up lands in one list whichever place it came from.
 */
const LOOPS_FORM_URL = 'https://app.loops.so/api/newsletter-form/clksm7aj203tclb0olg1z2xb3'

/** A sign-up that never answers is reported rather than left spinning. */
const TIMEOUT_MS = 15_000

/**
 * Why a sign-up did not go through: the waitlist could not be reached at all, or it answered and
 * turned the sign-up down. A refusal carries Loops' own explanation as `message` when it sends one.
 */
type JoinApiHostingBetaError = 'unreachable' | 'rejected'

/**
 * Adds an email to the API Hosting waitlist.
 *
 * Loops keeps any extra field as a contact property of the same name. Sign-ups from the API reference
 * set `oss`, as the Deploy panel does, so the list can tell them apart from the ones made on
 * scalar.com (`landing`) and in the API client (`client`). The framework goes along as `framework`
 * when there is one, as it does from the other sign-ups.
 */
export const joinApiHostingBeta = async ({
  email,
  framework,
}: {
  email: string
  framework?: string
}): Promise<Result<undefined, JoinApiHostingBetaError>> => {
  const body = new URLSearchParams({
    userGroup: 'Hosting',
    mailingLists: '',
    email,
    oss: 'true',
  })
  if (framework) {
    body.set('framework', framework)
  }

  // Loops sits behind Cloudflare, which turns a burst of sign-ups away without the CORS headers a
  // browser needs to read the answer, so being blocked looks the same as being offline.
  const response = await fetch(LOOPS_FORM_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch(() => null)

  if (!response) {
    return err('unreachable')
  }
  if (response.ok) {
    return ok(undefined)
  }

  const data: unknown = await response.json().catch(() => null)
  const message =
    data && typeof data === 'object' && 'message' in data && typeof data.message === 'string' ? data.message.trim() : ''

  return err('rejected', message || undefined)
}
