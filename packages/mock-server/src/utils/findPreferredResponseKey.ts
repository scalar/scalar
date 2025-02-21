/**
 * Find the preferred response key: default, 200, 201 …
 */
export function findPreferredResponseKey(responses?: string[]) {
  return (
    // Regular status codes
    ['default', '200', '201', '204', '404', '500'].find((key) => responses?.includes(key) ?? false) ??
    // Lowest status code
    responses?.sort()[0] ??
    undefined
  )
}
