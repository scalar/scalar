import semver from 'semver'

/**
 * Suggest a next version string given the current latest version.
 *
 * Copied from @scalar-org/entities/utility
 *
 * Recognises several common patterns:
 *  - Semver (1.2.3) → patch increment via semver.inc
 *  - Date with suffix (2025-01-15.hotfix) → today's date with same suffix
 *  - Date YYYY-MM-DD (2025-01-15) → today's date
 *  - Date YYYY-MM (2025-01) → current year-month
 *  - Sequential V/v prefix (V3, v12) → increment the number
 *
 * Falls back to returning the input unchanged when no pattern matches.
 */
export function suggestNextVersion(current: string): string {
  const inc = semver.inc(current, 'patch')
  if (inc) {
    return inc
  }

  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')

  const dateSuffix = current.match(/^(\d{4}-\d{2}-\d{2})\.(.+)$/)
  if (dateSuffix) {
    return `${yyyy}-${mm}-${dd}.release-name`
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(current)) {
    return `${yyyy}-${mm}-${dd}`
  }

  if (/^\d{4}-\d{2}$/.test(current)) {
    return `${yyyy}-${mm}`
  }

  const vNum = current.match(/^([Vv])(\d+)$/)
  if (vNum) {
    return `${vNum[1]}${Number(vNum[2]) + 1}`
  }

  return current
}
