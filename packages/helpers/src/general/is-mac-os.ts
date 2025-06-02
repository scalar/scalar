/**
 * Checks whether the user is on macOS
 * Uses the modern navigator.userAgentData API with a fallback to navigator.userAgent
 */
export const isMacOS = () => {
  if (typeof navigator === 'undefined') {
    return false
  }

  // Modern approach using navigator.userAgentData
  // @ts-expect-error - userAgentData is new, we can remove this when its stable
  if (navigator.userAgentData?.platform) {
    // @ts-expect-error - userAgentData is new, we can remove this when its stable
    return navigator.userAgentData.platform.toLowerCase().includes('mac')
  }

  // Fallback to userAgent
  return /Mac/.test(navigator.userAgent)
}
