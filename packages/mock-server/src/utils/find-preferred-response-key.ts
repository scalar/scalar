/** Matches an explicit HTTP status code (e.g. `200`) or a range pattern (e.g. `2XX`). */
const STATUS_CODE_REGEX = /^[1-5](\d{2}|XX)$/i

/** Whether a status key is a range pattern (e.g. `2XX`) rather than an explicit code. */
const isRange = (response: string): boolean => /XX$/i.test(response)

/** Whether a status key is an informational 1xx response. */
const isInformational = (response: string): boolean => response.startsWith('1')

/** Whether a status key is a 2xx success response. */
const isSuccess = (response: string): boolean => response.startsWith('2')

/** Turn a status key into a comparable number, treating a range like `2XX` as its lowest member (`200`). */
const toComparableStatus = (response: string): number => Number.parseInt(response.replace(/XX$/i, '00'), 10)

const sortStatusCodes = (responses: string[]): string[] =>
  responses
    .filter((response) => STATUS_CODE_REGEX.test(response))
    .sort((left, right) => {
      const difference = toComparableStatus(left) - toComparableStatus(right)
      // On a tie, prefer an explicit code over a range pattern (e.g. `200` before `2XX`).
      return difference !== 0 ? difference : Number(isRange(left)) - Number(isRange(right))
    })

/**
 * Find the preferred response key to mock.
 *
 * Preference order:
 * 1. The lowest 2xx success response
 * 2. The lowest non-informational code (3xx/4xx/5xx)
 * 3. `default` — the catch-all for undeclared responses (typically an error)
 * 4. An informational 1xx response, only when nothing else is defined
 *
 * Within each tier an explicit code wins over the range pattern that covers it (e.g. `200` over
 * `2XX`), and range patterns are treated as their lowest member (e.g. `2XX` → `200`). `default`
 * is the catch-all for codes not covered individually, so a defined success or error is preferred
 * over it.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.2.md#responses-object
 */
export function findPreferredResponseKey(responses?: string[]): string | undefined {
  if (!responses?.length) {
    return undefined
  }

  const statusCodes = sortStatusCodes(responses)

  // Within a tier, prefer an explicit status code over the range pattern that covers it.
  const byPreference = (predicate: (response: string) => boolean): string | undefined =>
    statusCodes.find((response) => predicate(response) && !isRange(response)) ?? statusCodes.find(predicate)

  return (
    byPreference(isSuccess) ??
    byPreference((response) => !isInformational(response)) ??
    (responses.includes('default') ? 'default' : undefined) ??
    byPreference(isInformational)
  )
}
