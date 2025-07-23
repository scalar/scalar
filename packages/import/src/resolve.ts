import { makeUrlAbsolute } from '@scalar/helpers/url/make-url-absolute'
import { parse } from 'yaml'

/**
 * Find an OpenAPI document URL in the HTML of @scalar/api-reference and other places.
 * This is useful to open the OpenAPI document from basically any source.
 */
export async function resolve(
  value?: string | null,
  options?: {
    /**
     * Fetch function to use instead of the global fetch. Use this to intercept requests.
     */
    fetch?: (url: string) => Promise<Response>
  },
): Promise<string | Record<string, any> | undefined> {
  // URLs
  if (value?.startsWith('http://') || value?.startsWith('https://')) {
    // Transform GitHub URLs to raw file URLs
    const githubRawUrl = transformGitHubUrl(value)

    if (githubRawUrl) {
      return githubRawUrl
    }

    // https://*.json
    if (value?.toLowerCase().endsWith('.json')) {
      return value
    }

    // https://*.yaml
    if (value?.toLowerCase().endsWith('.yaml') || value?.toLowerCase().endsWith('.yml')) {
      return value
    }

    // https://sandbox.scalar.com
    const sandboxUrl = value.match(/https:\/\/sandbox\.scalar\.com\/(p|e)\/([a-zA-Z0-9]+)/)

    if (sandboxUrl?.[2]) {
      return `https://sandbox.scalar.com/files/${sandboxUrl[2]}/openapi.yaml`
    }

    // Fetch URL
    try {
      let result = await (options?.fetch
        ? options.fetch(value)
        : fetch(value, {
            cache: 'no-cache',
          }))

      // If the custom fetch failed, try again with regular fetch
      if (!result.ok && options?.fetch) {
        result = await fetch(value, {
          cache: 'no-cache',
        })
      }

      if (result.ok) {
        const content = await result.text()
        const forwardedHost = result.headers.get('X-Forwarded-Host')

        // Check if content is directly JSON/YAML
        try {
          // Try parsing as JSON
          const jsonContent = JSON.parse(content)
          if (jsonContent.openapi || jsonContent.swagger) {
            return value
          }
        } catch {
          // Try parsing as YAML
          try {
            const yamlContent = parse(content)
            if (yamlContent?.openapi || yamlContent?.swagger) {
              return value
            }
          } catch {
            // Not YAML
          }
        }

        const urlOrPathOrDocument = parseHtml(content)

        // Document (string)
        if (typeof urlOrPathOrDocument === 'string') {
          try {
            // JSON?
            return JSON.parse(urlOrPathOrDocument)
          } catch {
            // No JSON
            try {
              // YAML?
              const yaml = parse(urlOrPathOrDocument)

              if (typeof yaml === 'object') {
                return yaml
              }
            } catch {
              // Not YAML
            }
          }
        }

        // Document (object)
        if (typeof urlOrPathOrDocument === 'object') {
          return urlOrPathOrDocument
        }

        // Relative or absolute URL
        if (urlOrPathOrDocument) {
          return makeUrlAbsolute(urlOrPathOrDocument, {
            baseUrl: forwardedHost || value,
          })
        }

        // Check for configuration attribute URL
        const configUrl = getConfigurationAttributeUrl(content)
        if (configUrl) {
          return makeUrlAbsolute(configUrl, {
            baseUrl: forwardedHost || value,
          })
        }

        // Check for embedded OpenAPI document
        const embeddedSpec = parseEmbeddedOpenApi(content)
        if (embeddedSpec) {
          return embeddedSpec
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

  // id="api-reference" data-url="*"
  const dataUrlMatch = html
    .match(/id=["']api-reference["'][\s\S]*?data-url=["']([^"']+)["']/)
    ?.slice(1)
    .find(Boolean)

  if (dataUrlMatch) {
    return dataUrlMatch
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
  const doubleEncodedConfigurationUrl = html.match(/&amp;quot;url&amp;quot;:&amp;quot;([^;]+)&amp;quot;/)

  if (doubleEncodedConfigurationUrl?.[1]) {
    return doubleEncodedConfigurationUrl[1]
  }

  // &amp;quot;url&amp;quot;:&amp;quot;MY_CUSTOM_URL&amp;quot;
  const encodedConfigurationUrl = html.match(/&quot;url&quot;:&quot;([^;]+)&quot;/)
  if (encodedConfigurationUrl?.[1]) {
    return encodedConfigurationUrl[1]
  }

  // Try to find embedded OpenAPI document in script tag first
  const scriptContent = parseScriptContent(html)
  if (scriptContent) {
    return scriptContent
  }

  // Check for configuration in script tag
  const scriptConfigMatch = html.match(/url:\s*["']([^"']+)["']/i)

  if (scriptConfigMatch?.[1]) {
    return scriptConfigMatch?.[1]
  }

  // Check for OpenAPI URLs in the HTML
  const linkMatch = html.match(/<a[^>]*href=["']([^"']+\.(?:yaml|yml|json))["'][^>]*>/i)

  if (linkMatch?.[1]) {
    return linkMatch[1]
  }

  // Check for URLs in escaped JS objects
  const escapedJsonMatch = html.match(/\\"spec\\":\{.*?\\"url\\":\\"([^"\\]+)\\"/)

  if (escapedJsonMatch?.[1]) {
    return escapedJsonMatch[1]
  }

  return undefined
}

/**
 * Get the content between the script tags
 *
 * @example <script id="api-reference">console.log("Hello, world!");</script>
 */
export function getContentOfScriptTag(html: string): string | undefined {
  const patterns = [
    // Double quotes
    /<script[^>]*id="api-reference[\s\S]*?">([\s\S]*?)<\/script>/i,
    // Single quotes
    /<script[^>]*id='api-reference[\s\S]*?'>([\s\S]*?)<\/script>/i,
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)

    if (match?.[1]) {
      return match[1].trim()
    }
  }

  return undefined
}

/**
 * Parse OpenAPI document directly from script tag content
 */
function parseScriptContent(html: string): Record<string, any> | undefined {
  const content = getContentOfScriptTag(html)

  try {
    if (content) {
      try {
        // JSON
        return JSON.parse(content)
      } catch {
        try {
          // JSON with escaped whitespace
          const sanitizedContent = content.replace(/\\s/g, '\\\\s')

          return JSON.parse(sanitizedContent)
        } catch {
          // YAML
          return parse(content)
        }
      }
    }
  } catch (error) {
    console.error('[@scalar/import] Failed to parse script content:', error)
  }

  return undefined
}

/**
 * Get the configuration attribute from the script tag
 *
 * @example <script id="api-reference" data-configuration="{&quot;spec&quot;:{&quot;content&quot;:&quot;foo&quot;}}"></script>
 */
export function getConfigurationAttribute(html: string): string | undefined {
  const patterns = [
    // Double quotes
    /<script[^>]*id="api-reference"[^>]*data-configuration=["]([^"]+)["][^>]*>(.*?)<\/script>/s,
    // Single quotes
    /<script[^>]*id='api-reference'[^>]*data-configuration=[']([^']+)['][^>]*>(.*?)<\/script>/s,
    // Mix quote single first
    /<script[^>]*id='api-reference'[^>]*data-configuration=["]([^"]+)["][^>]*>(.*?)<\/script>/s,
    // Mix quote double first
    /<script[^>]*id="api-reference"[^>]*data-configuration=[']([^']+)['][^>]*>(.*?)<\/script>/s,
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)

    if (match?.[1]) {
      return match[1]
    }
  }

  return undefined
}

/** Grab the URL from the configuration data attribute */
export const getConfigurationAttributeUrl = (html: string): string | undefined => {
  const configString = getConfigurationAttribute(html)
  if (!configString) {
    return undefined
  }

  const config = JSON.parse(decodeHtmlEntities(configString))
  return config.url || config.spec?.url
}

/**
 * Parse embedded OpenAPI document from HTML
 */
function parseEmbeddedOpenApi(html: string): object | undefined {
  const configString = getConfigurationAttribute(html)
  if (!configString) {
    return undefined
  }

  try {
    const config = JSON.parse(decodeHtmlEntities(configString))

    // Handle the old spec format while we transition to the new one
    const content = config.content || config.spec?.content

    // Handle both direct JSON content and YAML content
    if (content) {
      // If content is a string, assume it's YAML
      if (typeof content === 'string') {
        return parse(content)
      }
      // If content is an object, return it directly
      return content
    }
  } catch (error) {
    console.error('[@scalar/import] Failed to parse embedded OpenAPI document:', error)
  }

  return undefined
}

/**
 * Decode HTML entities in a string
 */
function decodeHtmlEntities(text: string): string {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
  } as const

  const updatedText = text
    .replace(new RegExp(Object.keys(entities).join('|'), 'g'), (match) => entities[match as keyof typeof entities])
    .replace(/\n/g, '\\n')
    .trim()

  if (updatedText.startsWith('{&quot;')) {
    // console.log('ok', updatedText)
    return decodeHtmlEntities(updatedText)
  }

  return updatedText
}

/**
 * Transform GitHub URLs to raw file URLs, preserving the branch information
 */
function transformGitHubUrl(url: string): string | undefined {
  const githubRegex = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/
  const match = url.match(githubRegex)

  if (match) {
    const [, owner, repo, branch, path] = match
    return `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/${branch}/${path}`
  }

  return undefined
}
