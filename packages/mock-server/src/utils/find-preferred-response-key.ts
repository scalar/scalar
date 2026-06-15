/** Matches an explicit HTTP status code (e.g. `200`) or a range pattern (e.g. `2XX`). */
const STATUS_CODE_REGEX = /^[1-5](\d{2}|XX)$/i

/** Whether a status key is a range pattern (e.g. `2XX`) rather than an explicit code. */
const isRange = (response: string): boolean => /XX$/i.test(response)

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
 * 1. `default` — the catch-all response always wins
 * 2. The lowest 2xx success response
 * 3. The lowest remaining status code, ignoring informational 1xx responses
 * 4. An informational 1xx response, only when nothing else is defined
 *
 * Range patterns like `2XX` are supported and treated as their lowest member (e.g. `200`).
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#patterned-fields-1
 */
export function findPreferredResponseKey(responses?: string[]): string | undefined {
  if (!responses?.length) {
    return undefined
  }

  if (responses.includes('default')) {
    return 'default'
  }

  const statusCodes = sortStatusCodes(responses)

  // Prefer a 2xx success, then the lowest non-informational code. Informational 1xx responses
  // are picked only as a last resort, since they are not meaningful to mock on their own.
  return (
    statusCodes.find((response) => response.startsWith('2')) ??
    statusCodes.find((response) => !response.startsWith('1')) ??
    statusCodes[0] ??
    [...responses].sort()[0]
  )
}
