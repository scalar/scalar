import type { HarRequest, Plugin, PluginConfiguration } from '@scalar/types/snippetz'

import { reduceQueryParams } from '@/libs/http'

/**
 * Converts a value to R list syntax with proper indentation
 */
const toRList = (obj: Record<string, string | string[]>, indent: string): string => {
  const entries = Object.entries(obj)

  if (entries.length === 0) {
    return 'list()'
  }

  const lines = entries.map(([key, value]) => {
    if (Array.isArray(value)) {
      const items = value.map((v) => `${indent}    "${v}"`).join(',\n')
      return `${indent}  "${key}" = c(\n${items}\n${indent}  )`
    }
    return `${indent}  "${key}" = "${value}"`
  })

  return `list(\n${lines.join(',\n')}\n${indent})`
}

/**
 * Formats JSON text as an R list structure
 */
const jsonToRList = (text: string, indent: string): string => {
  try {
    const obj = JSON.parse(text)
    return formatRValue(obj, indent)
  } catch {
    return `"${text}"`
  }
}

/**
 * Recursively formats a JS value as R syntax
 */
const formatRValue = (value: unknown, indent: string): string => {
  if (value === null || value === undefined) {
    return 'NULL'
  }
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE'
  }
  if (typeof value === 'number') {
    return String(value)
  }
  if (typeof value === 'string') {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return 'list()'
    }
    const items = value.map((v) => `${indent}  ${formatRValue(v, indent + '  ')}`).join(',\n')
    return `list(\n${items}\n${indent})`
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) {
      return 'list()'
    }
    const items = entries.map(([k, v]) => `${indent}  ${k} = ${formatRValue(v, indent + '  ')}`).join(',\n')
    return `list(\n${items}\n${indent})`
  }
  return String(value)
}

/**
 * r/httr2
 */
export const rHttr2: Plugin = {
  target: 'r',
  client: 'httr2',
  title: 'httr2',
  generate(request?: Partial<HarRequest>, configuration?: PluginConfiguration): string {
    const normalizedRequest = {
      url: 'https://example.com',
      method: 'GET',
      ...request,
    }

    const method = normalizedRequest.method.toUpperCase()
    const lines: string[] = ['library(httr2)', '']

    // Start the pipe chain
    lines.push(`response <- request("${normalizedRequest.url}") |>`)

    // Collect pipe steps
    const steps: string[] = []

    // Method (GET is default, so only add for non-GET)
    if (method !== 'GET') {
      steps.push(`  req_method("${method}")`)
    }

    // Headers
    const headers: Record<string, string> = {}

    if (normalizedRequest.headers?.length) {
      for (const header of normalizedRequest.headers) {
        headers[header.name] = header.value
      }
    }

    // Cookies as Cookie header
    if (normalizedRequest.cookies?.length) {
      const cookieString = normalizedRequest.cookies.map((c) => `${c.name}=${c.value}`).join('; ')
      headers['Cookie'] = cookieString
    }

    // Auth
    if (configuration?.auth?.username && configuration?.auth?.password) {
      steps.push(`  req_auth_basic("${configuration.auth.username}", "${configuration.auth.password}")`)
    }

    if (Object.keys(headers).length) {
      const headerEntries = Object.entries(headers)
      if (headerEntries.length === 1) {
        const [name, value] = headerEntries[0]!
        steps.push(`  req_headers("${name}" = "${value}")`)
      } else {
        const headerLines = headerEntries.map(([name, value]) => `    "${name}" = "${value}"`).join(',\n')
        steps.push(`  req_headers(\n${headerLines}\n  )`)
      }
    }

    // Query parameters
    if (normalizedRequest.queryString?.length) {
      const params = reduceQueryParams(normalizedRequest.queryString)
      const entries = Object.entries(params)
      if (entries.length === 1) {
        const [name, value] = entries[0]!
        if (Array.isArray(value)) {
          const items = value.map((v) => `"${v}"`).join(', ')
          steps.push(`  req_url_query("${name}" = c(${items}))`)
        } else {
          steps.push(`  req_url_query("${name}" = "${value}")`)
        }
      } else {
        const paramLines = entries
          .map(([name, value]) => {
            if (Array.isArray(value)) {
              const items = value.map((v) => `"${v}"`).join(', ')
              return `    "${name}" = c(${items})`
            }
            return `    "${name}" = "${value}"`
          })
          .join(',\n')
        steps.push(`  req_url_query(\n${paramLines}\n  )`)
      }
    }

    // Body
    if (normalizedRequest.postData) {
      const { mimeType, text, params } = normalizedRequest.postData

      if (mimeType === 'application/json' && text) {
        const rList = jsonToRList(text, '  ')
        steps.push(`  req_body_json(${rList})`)
      } else if (mimeType === 'multipart/form-data' && params) {
        const paramLines = params
          .map((p) => {
            if (p.fileName !== undefined) {
              return `    ${p.name} = curl::form_file("${p.fileName}")`
            }
            return `    ${p.name} = "${p.value ?? ''}"`
          })
          .join(',\n')
        steps.push(`  req_body_multipart(\n${paramLines}\n  )`)
      } else if (mimeType === 'application/x-www-form-urlencoded' && params) {
        const paramLines = params.map((p) => `    "${p.name}" = "${p.value ?? ''}"`).join(',\n')
        steps.push(`  req_body_form(\n${paramLines}\n  )`)
      } else if (text) {
        steps.push(`  req_body_raw("${text}", type = "${mimeType ?? 'application/octet-stream'}")`)
      }
    }

    // Always end with req_perform
    steps.push('  req_perform()')

    // Join steps with pipe operator
    lines[lines.length - 1] = `response <- request("${normalizedRequest.url}") |>`
    lines.push(steps.join(' |>\n'))

    lines.push('')
    lines.push('resp_body_string(response)')

    return lines.join('\n')
  },
}
