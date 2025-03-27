/**
 * Compares semver versions and checks if the left one is less than the right
 */
export const semverLessThan = (left: string, right: string): boolean => {
  // Parse the strings into numbers
  const parseSemver = (version: string): { major: number; minor: number; patch: number } => {
    const [major = 0, minor = 0, patch = 0] = version.split('.').map((part) => Number.parseInt(part, 10))
    return { major, minor, patch }
  }

  const { major: major1, minor: minor1, patch: patch1 } = parseSemver(left)
  const { major: major2, minor: minor2, patch: patch2 } = parseSemver(right)

  if (major1 < major2) {
    return true
  }
  if (major1 > major2) {
    return false
  }

  if (minor1 < minor2) {
    return true
  }
  if (minor1 > minor2) {
    return false
  }

  return patch1 < patch2
}
