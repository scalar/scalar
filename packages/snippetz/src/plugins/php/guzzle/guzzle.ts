import type { Plugin } from '@scalar/types/snippetz'

/**
 * php/guzzle
 */
export const phpGuzzle: Plugin = {
  target: 'php',
  client: 'guzzle',
  title: 'Guzzle',
  generate(request, configuration) {
    if (!request) {
      return ''
    }

    const options: Record<string, any> = {}
    const method = (request.method || 'GET').toUpperCase()
    const url = request.url || ''

    // Handle headers
    if (request.headers && Array.isArray(request.headers) && request.headers.length > 0) {
      const headers: Record<string, any> = {}
      request.headers.forEach((header) => {
        if (headers[header.name] === undefined) {
          headers[header.name] = header.value
        } else if (Array.isArray(headers[header.name])) {
          headers[header.name].push(header.value)
        } else {
          headers[header.name] = [headers[header.name], header.value]
        }
      })
      options.headers = headers
    }

    // Handle query parameters
    if (request.queryString && request.queryString.length > 0) {
      const query: Record<string, string> = {}
      request.queryString.forEach((param) => {
        query[param.name] = param.value
      })
      options.query = query
    }

    // Handle cookies
    if (request.cookies && request.cookies.length > 0) {
      const cookies: Record<string, string> = {}
      request.cookies.forEach((cookie) => {
        cookies[cookie.name] = cookie.value
      })
      options.cookies = cookies
    }

    // Handle authentication
    if (configuration?.auth?.username && configuration.auth.password) {
      options.auth = [configuration.auth.username, configuration.auth.password]
    }

    // Handle request body
    if (request.postData) {
      if (request.postData.mimeType === 'application/json') {
        try {
          options.json = JSON.parse(request.postData.text || '{}')
        } catch (e) {
          // If JSON parsing fails, use the raw text
          options.body = request.postData.text
        }
      } else if (request.postData.mimeType === 'multipart/form-data') {
        if (request.postData.params) {
          options.multipart = request.postData.params.map((param) => ({
            name: param.name,
            contents: param.fileName ? `fopen('${param.fileName}', 'r')` : param.value || '',
          }))
        } else if (request.postData.text) {
          try {
            options.form_params = JSON.parse(request.postData.text)
          } catch (e) {
            options.body = request.postData.text
          }
        }
      } else if (request.postData.mimeType === 'application/x-www-form-urlencoded') {
        if (request.postData.params) {
          const formParams: Record<string, string> = {}
          request.postData.params.forEach((param) => {
            formParams[param.name] = param.value || ''
          })
          options.form_params = formParams
        }
      } else {
        // For other mime types (like application/octet-stream), use the raw body
        options.body = request.postData.text
      }
    }

    // Handle compressed responses
    if (
      request.headers &&
      Array.isArray(request.headers) &&
      request.headers.some((h) => h.name === 'Accept-Encoding' && h.value.includes('gzip'))
    ) {
      options.decode_content = true
    }

    // Generate the PHP code
    let code = '$client = new GuzzleHttp\\Client();\n\n'

    if (Object.keys(options).length > 0) {
      // Format the options array with proper indentation
      const formattedOptions = formatOptionsArray(options)
      code += `$response = $client->request('${method}', '${url}', ${formattedOptions});`
    } else {
      code += `$response = $client->request('${method}', '${url}');`
    }

    return code
  },
}

/**
 * Helper function to format the PHP options array with proper indentation
 */
function formatOptionsArray(options: Record<string, any>, indent = 0): string {
  if (Object.keys(options).length === 0) return '[]'

  const spaces = ' '.repeat(4)
  let result = '[\n'

  for (const [key, value] of Object.entries(options)) {
    const formattedValue = formatValue(value, indent + 1)
    result += `${spaces.repeat(indent + 1)}'${key}' => ${formattedValue},\n`
  }

  result += `${spaces.repeat(indent)}]`
  return result
}

/**
 * Helper function to format values in the PHP array
 */
function formatValue(value: any, indent: number): string {
  if (value === null) return 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'string' && value.startsWith('fopen(')) return value
  if (typeof value === 'string') return `'${value}'`
  if (typeof value === 'number') return value.toString()
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const spaces = ' '.repeat(4)
    let result = '[\n'
    value.forEach((item) => {
      const formattedItem = formatValue(item, indent + 1)
      result += `${spaces.repeat(indent + 1)}${formattedItem},\n`
    })
    result += `${spaces.repeat(indent)}]`
    return result
  }
  if (typeof value === 'object') {
    return formatOptionsArray(value, indent)
  }
  return `'${value}'`
}
