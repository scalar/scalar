/** Decode authored URI fragments once, retaining literal percent characters in legacy references. */
export const decodeUriFragment = (fragment: string): string => {
  try {
    return decodeURIComponent(fragment)
  } catch {
    return fragment
  }
}
