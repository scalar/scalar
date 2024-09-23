/**
 * Find an OpenAPI document URL in the HTML of @scalar/api-reference and other places.
 * This is useful to open the OpenAPI document from basically any source.
 */
export async function resolve(value?: string) {
  // URLs
  if (value?.startsWith('http://') || value?.startsWith('https://')) {
    // https://*.json
    if (value?.toLowerCase().endsWith('.json')) {
      return value
    }

    // https://*.yaml
    if (
      value?.toLowerCase().endsWith('.yaml') ||
      value?.toLowerCase().endsWith('.yml')
    ) {
      return value
    }

    // https://sandbox.scalar.com
    const sandboxUrl = value.match(
      /https:\/\/sandbox\.scalar\.com\/(p|e)\/([a-z0-9]+)/,
    )

    if (sandboxUrl?.[2]) {
      return `https://sandbox.scalar.com/files/${sandboxUrl[2]}/openapi.yaml`
    }

    // Fetch URL
    try {
      const result = await fetch(value)

      if (result.ok) {
        const urlOrPath = parseHtml(await result.text())

        if (urlOrPath) {
          return makeRelativeUrlsAbsolute(value, urlOrPath)
        }
      } else {
        console.warn(`[@scalar/import] Failed to fetch ${value}`)
      }
    } catch (error) {
      console.error(`[@scalar/import] Failed to fetch ${value}`, error)
    }
  }

  return undefined
}

/**
 * Go through the HTML and try to find the OpenAPI document URL
 */
function parseHtml(html?: string) {
  // Check whether it could be HTML
  if (!html?.includes('<')) {
    return undefined
  }

  // data-url="*"
  const dataUrlMatch = html.match(/data-url=["']([^"']+)["']/)

  if (dataUrlMatch?.[1]) {
    return dataUrlMatch[1]
  }

  // spec-url="*"
  const specUrlMatch = html.match(/spec-url=["']([^"']+)["']/)

  if (specUrlMatch?.[1]) {
    return specUrlMatch[1]
  }

  // Redoc.init('*')
  const redocInit = html.match(/Redoc.init\(["']([^"']+)["']/)

  if (redocInit?.[1]) {
    return redocInit[1]
  }

  // &amp;quot;url&amp;quot;:&amp;quot;MY_CUSTOM_URL&amp;quot;
  const configurationUrl = html.match(
    /&amp;quot;url&amp;quot;:&amp;quot;([^;]+)&amp;quot;/,
  )

  if (configurationUrl?.[1]) {
    return configurationUrl[1]
  }

  return undefined
}

/**
 * URLs can be relative, but we need absolute URLs eventually.
 */
function makeRelativeUrlsAbsolute(baseUrl: string, path: string) {
  // Check whether the path is already absolute
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  // Combine the URL and the relative path
  try {
    const { href } = new URL(path, baseUrl)

    return href
  } catch (error) {
    // Return original path if URL creation fails
    console.error('[makeRelativeUrlsAbsolute] Error combining URLs:', error)

    return path
  }
}
