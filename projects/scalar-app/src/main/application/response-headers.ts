import type { BrowserWindow } from 'electron/main'

const MODIFIED_HEADERS_KEY = 'X-Scalar-Modified-Headers'

/**
 * Add wildcard CORS headers to all responses (so we don't need a proxy)
 */
export function overrideResponseHeaders(appWindow: BrowserWindow) {
  appWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const { responseHeaders } = details

    // If headers have already been modified, skip
    if (!responseHeaders?.[MODIFIED_HEADERS_KEY]) {
      // Add wildcard CORS headers
      upsertKeyValue(responseHeaders, 'Access-Control-Allow-Origin', ['*'])
      upsertKeyValue(responseHeaders, 'Access-Control-Allow-Methods', ['POST, GET, OPTIONS, PUT, DELETE, PATCH'])
      upsertKeyValue(responseHeaders, 'Access-Control-Allow-Headers', ['*'])
      upsertKeyValue(responseHeaders, 'Access-Control-Expose-Headers', ['*'])
    }

    callback({
      responseHeaders,
    })
  })
}

/**
 * Modify headers
 */
function upsertKeyValue(
  obj: Record<string, string> | Record<string, string[]> | undefined,
  keyToChange: string,
  value: string[],
) {
  const keyToChangeLower = keyToChange.toLowerCase()

  if (!obj) {
    return
  }

  // Add to modified headers
  if (Array.isArray(obj[MODIFIED_HEADERS_KEY])) {
    obj[MODIFIED_HEADERS_KEY].push(keyToChangeLower)
  } else {
    obj[MODIFIED_HEADERS_KEY] = [keyToChangeLower]
  }

  for (const key of Object.keys(obj)) {
    if (key.toLowerCase() === keyToChangeLower) {
      // If header exists already, prefix it with `X-Scalar-Original-Headfer`
      obj[`x-scalar-original-${key}`] = obj[keyToChangeLower]

      // Reassign old key
      obj[keyToChangeLower] = value

      // Done
      return
    }
  }

  // Insert at end instead
  obj[keyToChangeLower] = value
}
