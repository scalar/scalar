/**
 * Checks whether the user is on macOS
 * Uses the modern navigator.userAgentData API with a fallback to navigator.userAgent
 */
const getUserAgentDataPlatform = (nav: Navigator): string | undefined => {
  const userAgentData: unknown = Reflect.get(nav, 'userAgentData')

  if (!userAgentData || typeof userAgentData !== 'object') {
    return undefined
  }

  if (!('platform' in userAgentData) || typeof userAgentData.platform !== 'string') {
    return undefined
  }

  return userAgentData.platform
}

export const isMacOS = () => {
  if (typeof navigator === 'undefined') {
    return false
  }

  // Modern approach using navigator.userAgentData
  const userAgentDataPlatform = getUserAgentDataPlatform(navigator)
  if (userAgentDataPlatform) {
    return userAgentDataPlatform.toLowerCase().includes('mac')
  }

  // Fallback to userAgent
  return /Mac/.test(navigator.userAgent)
}
