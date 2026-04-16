import type { Plugin, PluginConfiguration } from '@scalar/types/snippetz'

const normalizeMethod = (method?: string): string => (method || 'GET').toUpperCase()

const escapeCString = (value: string): string =>
  value
    .replaceAll('\\', '\\\\')
    .replaceAll('"', '\\"')
    .replaceAll('\n', '\\n')
    .replaceAll('\r', '\\r')
    .replaceAll('\t', '\\t')

const normalizeUrl = (url: string): string => {
  if (!url) {
    return ''
  }

  try {
    const parsedUrl = new URL(url)
    const shouldOmitTrailingSlash =
      parsedUrl.pathname === '/' && !url.endsWith('/') && !url.includes('?') && !url.includes('#')
    const pathname = shouldOmitTrailingSlash ? '' : parsedUrl.pathname
    return `${parsedUrl.protocol}//${parsedUrl.host}${pathname}${parsedUrl.search}${parsedUrl.hash}`
  } catch {
    return url
  }
}

const buildUrlWithQuery = (url: string, queryString?: Array<{ name: string; value: string }>): string => {
  const query = queryString?.length ? queryString.map((param) => `${param.name}=${param.value}`).join('&') : ''

  if (!query) {
    return url
  }

  if (!url) {
    return `?${query}`
  }

  return `${url}${url.includes('?') ? '&' : '?'}${query}`
}

const buildCookieString = (cookies?: Array<{ name: string; value: string }>): string | null => {
  if (!cookies?.length) {
    return null
  }

  return cookies.map((cookie) => `${encodeURIComponent(cookie.name)}=${encodeURIComponent(cookie.value)}`).join('; ')
}

const buildFormUrlEncodedBody = (params?: Array<{ name: string; value?: string }>): string | null => {
  if (!params?.length) {
    return null
  }

  return params.map((param) => new URLSearchParams([[param.name, param.value ?? '']]).toString()).join('&')
}

const formatJsonBody = (text?: string): string => {
  if (text === undefined) {
    return ''
  }

  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

/**
 * c/libcurl
 */
export const cLibcurl: Plugin = {
  target: 'c',
  client: 'libcurl',
  title: 'Libcurl',
  generate(request, configuration?: PluginConfiguration) {
    if (!request) {
      return ''
    }

    const method = normalizeMethod(request.method)
    const normalizedUrl = normalizeUrl(request.url ?? '')
    const fullUrl = buildUrlWithQuery(normalizedUrl, request.queryString)
    const hasHeaders = Boolean(request.headers?.length)
    const hasCookies = Boolean(request.cookies?.length)
    const body = request.postData
    const isMultipartBody = body?.mimeType === 'multipart/form-data' && Boolean(body.params?.length)
    const headers = request.headers ?? []
    const shouldEnableCompression = headers.some(
      (header) => header.name.toLowerCase() === 'accept-encoding' && /gzip|deflate/.test(header.value),
    )

    const lines: string[] = [
      '#include <curl/curl.h>',
      '',
      'int main(void) {',
      '  curl_global_init(CURL_GLOBAL_DEFAULT);',
      '  CURL *curl = curl_easy_init();',
      '  if (!curl) {',
      '    curl_global_cleanup();',
      '    return 1;',
      '  }',
      '',
      `  curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, "${escapeCString(method)}");`,
      `  curl_easy_setopt(curl, CURLOPT_URL, "${escapeCString(fullUrl)}");`,
    ]

    if (configuration?.auth?.username && configuration.auth.password) {
      lines.push(
        `  curl_easy_setopt(curl, CURLOPT_USERPWD, "${escapeCString(`${configuration.auth.username}:${configuration.auth.password}`)}");`,
      )
    }

    if (hasHeaders) {
      lines.push('', '  struct curl_slist *headers = NULL;')

      headers.forEach((header) => {
        lines.push(`  headers = curl_slist_append(headers, "${escapeCString(`${header.name}: ${header.value}`)}");`)
      })

      lines.push('  curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);')
    }

    if (hasCookies) {
      const cookieString = buildCookieString(request.cookies)
      if (cookieString) {
        lines.push('', `  curl_easy_setopt(curl, CURLOPT_COOKIE, "${escapeCString(cookieString)}");`)
      }
    }

    if (shouldEnableCompression) {
      lines.push('', '  curl_easy_setopt(curl, CURLOPT_ACCEPT_ENCODING, "");')
    }

    if (body) {
      if (isMultipartBody && body.params) {
        lines.push('', '  curl_mime *mime = curl_mime_init(curl);')

        body.params.forEach((param) => {
          lines.push('', '  {', '    curl_mimepart *part = curl_mime_addpart(mime);')

          if (param.name) {
            lines.push(`    curl_mime_name(part, "${escapeCString(param.name)}");`)
          }

          if (param.fileName !== undefined) {
            lines.push(`    curl_mime_filedata(part, "${escapeCString(param.fileName)}");`)
          } else {
            lines.push(`    curl_mime_data(part, "${escapeCString(param.value ?? '')}", CURL_ZERO_TERMINATED);`)
          }

          if (param.contentType) {
            lines.push(`    curl_mime_type(part, "${escapeCString(param.contentType)}");`)
          }

          lines.push('  }')
        })

        lines.push('', '  curl_easy_setopt(curl, CURLOPT_MIMEPOST, mime);')
      } else if (body.mimeType === 'application/x-www-form-urlencoded' && body.params?.length) {
        const formBody = buildFormUrlEncodedBody(body.params)
        if (formBody !== null) {
          lines.push('', `  curl_easy_setopt(curl, CURLOPT_POSTFIELDS, "${escapeCString(formBody)}");`)
        }
      } else if (body.mimeType === 'application/json' && body.text !== undefined) {
        lines.push('', `  curl_easy_setopt(curl, CURLOPT_POSTFIELDS, "${escapeCString(formatJsonBody(body.text))}");`)
      } else if (body.text !== undefined) {
        const fallbackBody = body.mimeType === 'application/octet-stream' ? body.text : formatJsonBody(body.text)
        lines.push('', `  curl_easy_setopt(curl, CURLOPT_POSTFIELDS, "${escapeCString(fallbackBody)}");`)
      }
    }

    lines.push('', '  CURLcode res = curl_easy_perform(curl);')

    if (isMultipartBody) {
      lines.push('  curl_mime_free(mime);')
    }

    if (hasHeaders) {
      lines.push('  curl_slist_free_all(headers);')
    }

    lines.push('  curl_easy_cleanup(curl);', '  curl_global_cleanup();', '', '  return (int)res;', '}')

    return lines.join('\n')
  },
}
