import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'

import { matchesDomain } from '@/libs/send-request/set-request-cookies'

export const filterGlobalCookie = ({
  cookie,
  url,
  disabledGlobalCookies,
}: {
  cookie: XScalarCookie
  url: string
  disabledGlobalCookies: Record<string, boolean>
}): boolean => {
  if (cookie.isDisabled || disabledGlobalCookies[cookie.name] === true || !cookie.name) {
    return false
  }

  const urlObject = new URL(url)

  if (cookie.domain && !matchesDomain(url, cookie.domain)) {
    return false
  }

  if (cookie.path && !urlObject.pathname.startsWith(cookie.path)) {
    return false
  }

  return true
}
