import { createSearchParams } from '@/utils/create-search-params'
import { objectToString, Unquoted } from '@/utils/objectToString'
import type { Plugin } from '@scalar/types/snippetz'

/**
 * node/fetch
 */
export const nodeFetch: Plugin = {
  target: 'node',
  client: 'fetch',
  title: 'Fetch',
  generate(request) {
    // Defaults
    const normalizedRequest = {
      method: 'GET',
      ...request,
    }

    let prefix = ''

    // Normalization
    normalizedRequest.method = normalizedRequest.method.toUpperCase()

    // Reset fetch defaults
    const options: Record<string, any> = {
      method: normalizedRequest.method === 'GET' ? undefined : normalizedRequest.method,
    }

    // Query
    const searchParams = createSearchParams(normalizedRequest.queryString)
    const queryString = searchParams.size ? `?${searchParams.toString()}` : ''

    // Headers
    if (normalizedRequest.headers?.length) {
      options.headers = {}

      normalizedRequest.headers.forEach((header) => {
        options.headers![header.name] = header.value
      })
    }

    // Cookies
    if (normalizedRequest.cookies?.length) {
      options.headers = options.headers || {}

      normalizedRequest.cookies.forEach((cookie) => {
        options.headers!['Set-Cookie'] = options.headers!['Set-Cookie']
          ? `${options.headers!['Set-Cookie']}; ${cookie.name}=${cookie.value}`
          : `${cookie.name}=${cookie.value}`
      })
    }

    // Remove undefined keys
    Object.keys(options).forEach((key) => {
      if (options[key] === undefined) {
        delete options[key]
      }
    })

    // Add body
    if (normalizedRequest.postData) {
      const { mimeType, text, params } = normalizedRequest.postData
      let hasFsImport = false

      if (mimeType === 'application/json' && text) {
        try {
          options.body = new Unquoted(`JSON.stringify(${objectToString(JSON.parse(text))})`)
        } catch (e) {
          options.body = text
        }
      } else if (mimeType === 'multipart/form-data' && params) {
        prefix = 'const formData = new FormData()\n'
        params.forEach((param) => {
          if (param.fileName !== undefined) {
            if (!hasFsImport) {
              prefix = `import fs from 'node:fs'\n\n${prefix}`
              hasFsImport = true
            }
            prefix += `formData.append('${param.name}', new Blob([fs.readFileSync('${param.fileName}')]), '${param.fileName}')\n`
          } else if (param.value !== undefined) {
            prefix += `formData.append('${param.name}', '${param.value}')\n`
          }
        })
        prefix += '\n'
        options.body = new Unquoted('formData')
      } else if (mimeType === 'application/x-www-form-urlencoded' && params) {
        const form = Object.fromEntries(params.map((p) => [p.name, p.value]))
        options.body = new Unquoted(`new URLSearchParams(${objectToString(form)})`)
      } else {
        options.body = normalizedRequest.postData.text
      }
    }

    // Transform to JSON
    const jsonOptions = Object.keys(options).length ? `, ${objectToString(options)}` : ''

    // Code Template
    return `${prefix}fetch('${normalizedRequest.url}${queryString}'${jsonOptions})`
  },
}
