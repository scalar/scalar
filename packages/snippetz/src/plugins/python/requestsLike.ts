import type { HarRequest, PluginConfiguration } from '@scalar/types/snippetz'

import { reduceQueryParams } from '@/libs/http'

const LENGTH_CONSIDERED_AS_SHORT = 40

// Function to convert JavaScript boolean and null values to Python equivalents
function convertToPythonSyntax(str: string): string {
  const replacements = [
    ['true', 'True'],
    ['false', 'False'],
    ['null', 'None'],
  ]

  let result = str
  for (const [jsonVal, pythonVal] of replacements) {
    const patterns = [`(: )${jsonVal}(?=,|\\n)`, `^( +)${jsonVal}(?=,|\\n)`]

    for (const pattern of patterns) {
      result = result.replace(new RegExp(pattern, 'gm'), `$1${pythonVal}`)
    }
  }

  return result
}

export function requestsLikeGenerate(
  clientVar: string,
  request?: Partial<HarRequest>,
  configuration?: PluginConfiguration,
) {
  // Normalize request with defaults
  const normalizedRequest = {
    url: 'https://example.com',
    method: 'get',
    ...request,
  }

  // Normalize method to lowercase for requests library
  const method = normalizedRequest.method.toLowerCase()

  // Build options object
  const options: Record<string, any> = {}

  // Add headers if present
  if (normalizedRequest.headers?.length) {
    options.headers = normalizedRequest.headers.reduce(
      (acc, header) => {
        if (!(header.name in acc)) {
          acc[header.name] = header.value
        }
        return acc
      },
      {} as Record<string, string>,
    )
  }

  // Add query parameters if present
  if (normalizedRequest.queryString?.length) {
    options.params = reduceQueryParams(normalizedRequest.queryString)
  }

  // Add cookies if present
  if (normalizedRequest.cookies?.length) {
    options.cookies = Object.fromEntries(normalizedRequest.cookies.map((c) => [c.name, c.value]))
  }

  // Add auth if present
  if (configuration?.auth?.username && configuration?.auth?.password) {
    options.auth = [configuration.auth.username, configuration.auth.password]
  }

  // Handle request body
  if (normalizedRequest.postData) {
    const { mimeType, text, params } = normalizedRequest.postData

    if (mimeType === 'application/json' && text) {
      try {
        options.json = JSON.parse(text)
      } catch {
        options.data = text
      }
    } else if (mimeType === 'application/octet-stream' && text) {
      options.data = text // Store raw text, we'll handle the b"..." formatting later
    } else if (mimeType === 'multipart/form-data' && params) {
      const files: string[] = []
      const formData: Record<string, string> = {}

      params.forEach((param) => {
        if (param.fileName !== undefined) {
          const name = JSON.stringify(param.name)
          const fileName = JSON.stringify(param.fileName)
          const file = `open(${fileName}, "rb")`

          if (param.contentType) {
            const contentType = JSON.stringify(param.contentType)
            files.push(`(${name}, (${fileName}, ${file}, ${contentType}))`)
          } else {
            files.push(`(${name}, ${file})`)
          }
        } else if (param.value !== undefined) {
          if (param.contentType) {
            const name = JSON.stringify(param.name)
            const value = JSON.stringify(param.value)
            const contentType = JSON.stringify(param.contentType)

            files.push(`(${name}, (None, ${value}, ${contentType}))`)
          } else {
            formData[param.name] = param.value
          }
        }
      })

      if (files.length) {
        options.files = files
      }
      if (Object.keys(formData).length) {
        options.data = formData
      }
    } else if (mimeType === 'application/x-www-form-urlencoded' && params) {
      options.data = Object.fromEntries(params.map((p) => [p.name, p.value]))
    }
  }

  // Format all parameters
  const formattedParams: string[] = []

  // Format URL based on length
  const urlParam = `"${normalizedRequest.url}"`
  if (normalizedRequest.url.length > LENGTH_CONSIDERED_AS_SHORT) {
    formattedParams.push(urlParam)
  } else {
    // Will be handled in the return statement for short URLs
    formattedParams.push('')
  }

  // Format options
  for (const [key, value] of Object.entries(options)) {
    if (key === 'auth') {
      formattedParams.push(
        `${key}=(${convertToPythonSyntax(JSON.stringify(value[0]))}, ${convertToPythonSyntax(JSON.stringify(value[1]))})`,
      )
    } else if (key === 'files') {
      const filesTuples = value.map((tuple: string) => `      ${tuple}`)
      const filesStr = '[\n' + filesTuples.join(',\n') + '\n    ]'
      formattedParams.push(`${key}=${filesStr}`)
    } else if (key === 'json') {
      const jsonString = convertToPythonSyntax(
        JSON.stringify(value, null, 2)
          .split('\n')
          .map((line, i) => (i === 0 ? line : '    ' + line))
          .join('\n'),
      )
      formattedParams.push(`${key}=${jsonString}`)
    } else if (key === 'data' && normalizedRequest.postData?.mimeType === 'application/octet-stream') {
      // Special handling for binary data
      formattedParams.push(`${key}=b"${value}"`)
    } else {
      const str = convertToPythonSyntax(
        JSON.stringify(value, null, 2)
          .split('\n')
          .map((line, i) => (i === 0 ? line : '    ' + line))
          .join('\n'),
      )
      formattedParams.push(`${key}=${str}`)
    }
  }

  // Build the final request string with conditional URL formatting
  if (normalizedRequest.url.length > LENGTH_CONSIDERED_AS_SHORT) {
    return `${clientVar}.${method}(\n    ${formattedParams.join(',\n    ')}\n)`
  }

  // For short URLs with no additional parameters, return a single-line format
  if (formattedParams.length <= 1) {
    return `${clientVar}.${method}(${urlParam})`
  }

  // For short URLs with parameters, maintain the multi-line format
  return `${clientVar}.${method}(${urlParam}${formattedParams.length > 1 ? ',' : ''}\n    ${formattedParams.slice(1).join(',\n    ')}\n)`
}
