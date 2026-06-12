const sortStatusCodes = (responses: string[]): string[] =>
  responses
    .filter((response) => /^\d{3}$/.test(response))
    .sort((left, right) => Number.parseInt(left, 10) - Number.parseInt(right, 10))

/**
 * Find the preferred response key: default, a 2xx success, then the lowest status code.
 */
export function findPreferredResponseKey(responses?: string[]) {
  if (!responses?.length) {
    return undefined
  }

  if (responses.includes('default')) {
    return 'default'
  }

  const statusCodes = sortStatusCodes(responses)

  return (
    statusCodes.find((response) => response.startsWith('2')) ?? statusCodes[0] ?? [...responses].sort()[0] ?? undefined
  )
}
