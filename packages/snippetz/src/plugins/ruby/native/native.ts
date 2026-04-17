import type { Plugin } from '@scalar/types/snippetz'

import { buildQueryString } from '@/libs/http'

const escapeRubyDoubleQuoted = (value: string): string => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

const escapeRubySingleQuoted = (value: string): string => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")

const encodeFormComponent = (value: string): string => encodeURIComponent(value).replace(/'/g, '%27')

const standardMethods = new Set([
  'GET',
  'POST',
  'HEAD',
  'DELETE',
  'PATCH',
  'PUT',
  'OPTIONS',
  'COPY',
  'LOCK',
  'UNLOCK',
  'MOVE',
  'TRACE',
])

const toRubyMethodClass = (method: string): string => method.charAt(0) + method.slice(1).toLowerCase()

const maybeAddCustomMethodClass = (lines: string[], method: string, hasBody: boolean): void => {
  if (standardMethods.has(method)) {
    return
  }

  const methodClass = toRubyMethodClass(method)
  lines.push(`class Net::HTTP::${methodClass} < Net::HTTPRequest`)
  lines.push(`  METHOD = '${method}'`)
  lines.push(`  REQUEST_HAS_BODY = '${hasBody ? 'true' : 'false'}'`)
  lines.push('  RESPONSE_HAS_BODY = true')
  lines.push('end')
  lines.push('')
}

const encodeUrlWithPathPreservedBrackets = (url: string): string => {
  try {
    const parsedUrl = new URL(url)
    const encodedPath = parsedUrl.pathname
      .split('/')
      .map((segment) =>
        encodeURIComponent(decodeURIComponent(segment)).replace(/%5B/g, '[').replace(/%5D/g, ']').replace(/%24/g, '$'),
      )
      .join('/')

    // Keep legacy behavior from the previous converter: omit trailing slash for origin-only URLs.
    if (parsedUrl.pathname === '/') {
      return `${parsedUrl.origin}${parsedUrl.search}${parsedUrl.hash}`
    }

    return `${parsedUrl.origin}${encodedPath}${parsedUrl.search}${parsedUrl.hash}`
  } catch {
    return url
  }
}

/**
 * ruby/native
 */
export const rubyNative: Plugin = {
  target: 'ruby',
  client: 'native',
  title: 'net::http',
  generate(request, configuration) {
    const normalizedRequest = {
      method: 'GET',
      ...request,
    }

    normalizedRequest.method = normalizedRequest.method.toUpperCase()

    const queryString = buildQueryString(normalizedRequest.queryString)
    const rawUrl = `${normalizedRequest.url ?? ''}${queryString}`
    const encodedUrl = encodeUrlWithPathPreservedBrackets(rawUrl)

    const lines: string[] = ["require 'uri'", "require 'net/http'", '']
    maybeAddCustomMethodClass(lines, normalizedRequest.method, Boolean(normalizedRequest.postData?.text))

    lines.push(`url = URI("${escapeRubyDoubleQuoted(encodedUrl)}")`, '')

    lines.push('http = Net::HTTP.new(url.host, url.port)')
    if (encodedUrl.startsWith('https://')) {
      lines.push('http.use_ssl = true')
    }

    lines.push('')

    const methodClass = toRubyMethodClass(normalizedRequest.method)
    lines.push(`request = Net::HTTP::${methodClass}.new(url)`)

    if (configuration?.auth?.username && configuration?.auth?.password) {
      const username = escapeRubyDoubleQuoted(configuration.auth.username)
      const password = escapeRubyDoubleQuoted(configuration.auth.password)
      lines.push(`request.basic_auth("${username}", "${password}")`)
    }

    if (normalizedRequest.headers?.length) {
      normalizedRequest.headers.forEach((header) => {
        lines.push(`request["${escapeRubyDoubleQuoted(header.name)}"] = '${escapeRubySingleQuoted(header.value)}'`)
      })
    }

    if (normalizedRequest.cookies?.length) {
      const cookieString = normalizedRequest.cookies
        .map((cookie) => `${encodeFormComponent(cookie.name)}=${encodeFormComponent(cookie.value)}`)
        .join('; ')
      lines.push(`request["Cookie"] = '${escapeRubySingleQuoted(cookieString)}'`)
    }

    if (normalizedRequest.postData) {
      const { mimeType, text, params } = normalizedRequest.postData

      if (mimeType === 'application/json' && text !== undefined) {
        try {
          const parsed = JSON.parse(text)
          const prettyJson = JSON.stringify(parsed, null, 2)
          lines.push('request.body = <<~JSON')
          lines.push(prettyJson)
          lines.push('JSON')
        } catch {
          lines.push(`request.body = ${JSON.stringify(text)}`)
        }
      } else if (mimeType === 'application/x-www-form-urlencoded' && params) {
        const encodedForm = params
          .map((param) => `${encodeFormComponent(param.name)}=${encodeFormComponent(param.value ?? '')}`)
          .join('&')
        lines.push(`request.body = '${escapeRubySingleQuoted(encodedForm)}'`)
      } else if (mimeType === 'multipart/form-data' && params) {
        lines.push('form_data = []')
        params.forEach((param) => {
          const name = escapeRubySingleQuoted(param.name)
          if (param.fileName !== undefined) {
            const fileName = escapeRubySingleQuoted(param.fileName)
            if (param.contentType) {
              const contentType = escapeRubySingleQuoted(param.contentType)
              lines.push(
                `form_data << ['${name}', File.open('${fileName}'), { filename: '${fileName}', content_type: '${contentType}' }]`,
              )
            } else {
              lines.push(`form_data << ['${name}', File.open('${fileName}')]`)
            }
          } else if (param.contentType) {
            const value = escapeRubySingleQuoted(param.value ?? '')
            const contentType = escapeRubySingleQuoted(param.contentType)
            lines.push(`form_data << ['${name}', '${value}', { content_type: '${contentType}' }]`)
          } else {
            const value = escapeRubySingleQuoted(param.value ?? '')
            lines.push(`form_data << ['${name}', '${value}']`)
          }
        })
        lines.push("request.set_form(form_data, 'multipart/form-data')")
      } else if (mimeType === 'application/octet-stream') {
        lines.push(`request.body = ${JSON.stringify(text ?? '')}`)
      } else if (text !== undefined) {
        lines.push(`request.body = ${JSON.stringify(text)}`)
      }
    }

    lines.push('', 'response = http.request(request)', 'puts response.read_body')

    return lines.join('\n')
  },
}
