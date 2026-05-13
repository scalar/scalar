/**
 * Compare two semver-style version strings without pulling in a `semver`
 * dependency. We only need the small subset that supports `MAJOR.MINOR.PATCH`
 * with an optional pre-release tag, which is more than enough for the
 * "What's new" feature where versions look like `3.5.1` or `3.6.0-beta.1`.
 *
 * Returns a negative number when `a < b`, `0` when they are equal, and a
 * positive number when `a > b` - matching the contract of `Array.sort`.
 *
 * Pre-release versions (e.g. `1.0.0-rc.1`) are treated as **lower** than
 * the same version without a pre-release tag, per the semver spec. This is
 * intentional so users on a stable release do not see beta-only entries.
 *
 * Build metadata (anything after `+`) is stripped before comparison, also
 * per the semver spec.
 */
export const compareVersions = (a: string, b: string): number => {
  const parsed = (input: string): { numeric: number[]; pre: string[] } => {
    const [withoutBuild = ''] = input.split('+')
    const hyphenIndex = withoutBuild.indexOf('-')
    const core = hyphenIndex === -1 ? withoutBuild : withoutBuild.slice(0, hyphenIndex)
    const preRelease = hyphenIndex === -1 ? undefined : withoutBuild.slice(hyphenIndex + 1)
    const numeric = core.split('.').map((part) => Number.parseInt(part, 10) || 0)
    const pre = preRelease ? preRelease.split('.') : []
    return { numeric, pre }
  }

  const left = parsed(a)
  const right = parsed(b)

  const length = Math.max(left.numeric.length, right.numeric.length)
  for (let index = 0; index < length; index += 1) {
    const diff = (left.numeric[index] ?? 0) - (right.numeric[index] ?? 0)
    if (diff !== 0) {
      return diff
    }
  }

  // No pre-release on either side, versions are equal.
  if (left.pre.length === 0 && right.pre.length === 0) {
    return 0
  }
  // A version without a pre-release outranks one that has it.
  if (left.pre.length === 0) {
    return 1
  }
  if (right.pre.length === 0) {
    return -1
  }

  // Both have pre-release identifiers - compare segment by segment.
  const preLength = Math.max(left.pre.length, right.pre.length)
  for (let index = 0; index < preLength; index += 1) {
    const leftSegment = left.pre[index]
    const rightSegment = right.pre[index]
    if (leftSegment === undefined) {
      return -1
    }
    if (rightSegment === undefined) {
      return 1
    }
    const leftNumeric = Number.parseInt(leftSegment, 10)
    const rightNumeric = Number.parseInt(rightSegment, 10)
    const leftIsNumeric = !Number.isNaN(leftNumeric) && String(leftNumeric) === leftSegment
    const rightIsNumeric = !Number.isNaN(rightNumeric) && String(rightNumeric) === rightSegment

    if (leftIsNumeric && rightIsNumeric) {
      const diff = leftNumeric - rightNumeric
      if (diff !== 0) {
        return diff
      }
      continue
    }
    // Numeric identifiers always have lower precedence than alphanumeric.
    if (leftIsNumeric) {
      return -1
    }
    if (rightIsNumeric) {
      return 1
    }
    if (leftSegment < rightSegment) {
      return -1
    }
    if (leftSegment > rightSegment) {
      return 1
    }
  }

  return 0
}

/** Convenience wrapper: `true` when `a` is strictly less than `b`. */
export const isVersionLessThan = (a: string, b: string): boolean => {
  return compareVersions(a, b) < 0
}

/** Convenience wrapper: `true` when `a` is less than or equal to `b`. */
export const isVersionLessThanOrEqual = (a: string, b: string): boolean => {
  return compareVersions(a, b) <= 0
}
