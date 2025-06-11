import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Request as HarRequest } from 'har-format'

type ProcessedParameters = {
  url: string
  headers: HarRequest['headers']
  queryString: HarRequest['queryString']
}

/**
 * Process OpenAPI parameters and return the updated properties.
 * Handles path, query, and header parameters with various styles and explode options.
 *
 * @see https://spec.openapis.org/oas/latest.html#style-values
 */
export const processParameters = (
  harRequest: HarRequest,
  parameters: OpenAPIV3_1.ParameterObject[],
  example?: unknown,
): ProcessedParameters => {
  // Create copies of the arrays to avoid modifying the input
  const newHeaders = [...harRequest.headers]
  const newQueryString = [...harRequest.queryString]
  let newUrl = harRequest.url

  for (const param of parameters) {
    if (!param.in || !param.name) {
      continue
    }

    const paramValue =
      example && typeof example === 'object' ? (example as Record<string, unknown>)[param.name] : undefined

    if (paramValue === undefined) {
      continue
    }

    const style = param.style || 'simple'
    const explode = param.explode ?? false

    switch (param.in) {
      case 'path': {
        newUrl = processPathParameters(newUrl, param, paramValue, style, explode)
        break
      }
      case 'query': {
        // Handle query parameters
        switch (style) {
          case 'form': {
            if (explode) {
              // Form explode array: color=blue&color=black&color=brown
              if (Array.isArray(paramValue)) {
                for (const value of paramValue as unknown[]) {
                  newQueryString.push({ name: param.name, value: String(value) })
                }
              }
              // Form explode object: R=100&G=200&B=150
              else if (typeof paramValue === 'object' && paramValue !== null) {
                for (const [key, value] of Object.entries(paramValue as Record<string, unknown>)) {
                  newQueryString.push({ name: key, value: String(value) })
                }
              }
              // Form explode primitive: color=blue
              else {
                newQueryString.push({ name: param.name, value: String(paramValue) })
              }
            } else {
              // Form no explode array: color=blue,black,brown
              if (Array.isArray(paramValue)) {
                newQueryString.push({ name: param.name, value: (paramValue as unknown[]).join(',') })
              }
              // Form no explode object: color=R,100,G,200,B,150
              else if (typeof paramValue === 'object' && paramValue !== null) {
                const values = Object.entries(paramValue as Record<string, unknown>)
                  .map(([k, v]) => `${k},${v}`)
                  .join(',')
                newQueryString.push({ name: param.name, value: values })
              }
              // Form no explode primitive: color=blue
              else {
                newQueryString.push({ name: param.name, value: String(paramValue) })
              }
            }
            break
          }
          case 'spaceDelimited': {
            // SpaceDelimited array: color=blue%20black%20brown
            if (Array.isArray(paramValue)) {
              newQueryString.push({ name: param.name, value: (paramValue as unknown[]).join(' ') })
            }
            // SpaceDelimited object: color=R%20100%20G%20200%20B%20150
            else if (typeof paramValue === 'object' && paramValue !== null) {
              const values = Object.entries(paramValue as Record<string, unknown>)
                .map(([k, v]) => `${k} ${v}`)
                .join(' ')
              newQueryString.push({ name: param.name, value: values })
            }
            break
          }
          case 'pipeDelimited': {
            // PipeDelimited array: color=blue%7Cblack%7Cbrown
            if (Array.isArray(paramValue)) {
              newQueryString.push({ name: param.name, value: (paramValue as unknown[]).join('|') })
            }
            // PipeDelimited object: color=R%7C100%7CG%7C200%7CB%7C150
            else if (typeof paramValue === 'object' && paramValue !== null) {
              const values = Object.entries(paramValue as Record<string, unknown>)
                .flat()
                .join('|')
              newQueryString.push({ name: param.name, value: values })
            }
            break
          }
          case 'deepObject': {
            // DeepObject: color[R]=100&color[G]=200&color[B]=150
            if (explode && typeof paramValue === 'object' && paramValue !== null) {
              for (const [key, value] of Object.entries(paramValue as Record<string, unknown>)) {
                newQueryString.push({ name: `${param.name}[${key}]`, value: String(value) })
              }
            }
            break
          }

          // Default to form style
          default:
            newQueryString.push({ name: param.name, value: String(paramValue) })
        }
        break
      }
      case 'header':
        newHeaders.push({ name: param.name, value: String(paramValue) })
        break
    }
  }

  return {
    url: newUrl,
    headers: newHeaders,
    queryString: newQueryString,
  }
}

/**
 * Process path parameters according to OpenAPI specification.
 * Handles matrix, label, and simple styles with explode options.
 *
 * @param url - The URL to process
 * @param param - The parameter object
 * @param paramValue - The value of the parameter
 * @param style - The style of the parameter (matrix, label, simple)
 * @param explode - Whether to explode the parameter
 * @returns The updated URL with processed path parameters
 */
const processPathParameters = (
  url: string,
  param: OpenAPIV3_1.ParameterObject,
  paramValue: unknown,
  style: string,
  explode: boolean,
): string => {
  switch (style) {
    case 'matrix': {
      if (explode) {
        // Matrix explode array: ;color=blue;color=black;color=brown
        if (Array.isArray(paramValue)) {
          const values = (paramValue as unknown[]).map((v) => `${param.name}=${v}`).join(';')
          return url.replace(`{;${param.name}}`, `;${values}`)
        }

        // Matrix explode object: ;R=100;G=200;B=150
        if (typeof paramValue === 'object' && paramValue !== null) {
          const values = Object.entries(paramValue as Record<string, unknown>)
            .map(([k, v]) => `${k}=${v}`)
            .join(';')
          return url.replace(`{;${param.name}}`, `;${values}`)
        }

        // Matrix explode primitive: ;color=blue
        return url.replace(`{;${param.name}}`, `;${param.name}=${paramValue}`)
      }

      // Matrix no explode array: ;color=blue,black,brown
      if (Array.isArray(paramValue)) {
        return url.replace(`{;${param.name}}`, `;${param.name}=${(paramValue as unknown[]).join(',')}`)
      }

      // Matrix no explode object: ;color=R,100,G,200,B,150
      if (typeof paramValue === 'object' && paramValue !== null) {
        const values = Object.entries(paramValue as Record<string, unknown>)
          .map(([k, v]) => `${k},${v}`)
          .join(',')
        return url.replace(`{;${param.name}}`, `;${param.name}=${values}`)
      }

      // Matrix no explode primitive: ;color=blue
      return url.replace(`{;${param.name}}`, `;${param.name}=${paramValue}`)
    }
    case 'label': {
      if (explode) {
        // Label explode array: .blue.black.brown
        if (Array.isArray(paramValue)) {
          return url.replace(`{.${param.name}}`, `.${(paramValue as unknown[]).join('.')}`)
        }

        // Label explode object: .R=100.G=200.B=150
        if (typeof paramValue === 'object' && paramValue !== null) {
          const values = Object.entries(paramValue as Record<string, unknown>)
            .map(([k, v]) => `${k}=${v}`)
            .join('.')

          return url.replace(`{.${param.name}}`, `.${values}`)
        }

        // Label explode primitive: .blue
        return url.replace(`{.${param.name}}`, `.${paramValue}`)
      }

      // Label no explode array: .blue,black,brown
      if (Array.isArray(paramValue)) {
        return url.replace(`{.${param.name}}`, `.${(paramValue as unknown[]).join(',')}`)
      }

      // Label no explode object: .R,100,G,200,B,150
      if (typeof paramValue === 'object' && paramValue !== null) {
        const values = Object.entries(paramValue as Record<string, unknown>)
          .map(([k, v]) => `${k},${v}`)
          .join(',')

        return url.replace(`{.${param.name}}`, `.${values}`)
      }

      // Label no explode primitive: .blue
      return url.replace(`{.${param.name}}`, `.${paramValue}`)
    }

    case 'simple': {
      if (explode) {
        // Simple explode array: blue,black,brown
        if (Array.isArray(paramValue)) {
          return url.replace(`{${param.name}}`, (paramValue as unknown[]).join(','))
        }

        // Simple explode object: R=100,G=200,B=150
        if (typeof paramValue === 'object' && paramValue !== null) {
          const values = Object.entries(paramValue as Record<string, unknown>)
            .map(([k, v]) => `${k}=${v}`)
            .join(',')

          return url.replace(`{${param.name}}`, values)
        }

        // Simple explode primitive: blue
        return url.replace(`{${param.name}}`, String(paramValue))
      }
      // Simple no explode array: blue,black,brown
      if (Array.isArray(paramValue)) {
        return url.replace(`{${param.name}}`, (paramValue as unknown[]).join(','))
      }

      // Simple no explode object: R,100,G,200,B,150
      if (typeof paramValue === 'object' && paramValue !== null) {
        const values = Object.entries(paramValue as Record<string, unknown>)
          .map(([k, v]) => `${k},${v}`)
          .join(',')

        return url.replace(`{${param.name}}`, values)
      }

      // Simple no explode primitive: blue
      return url.replace(`{${param.name}}`, String(paramValue))
    }

    // Default to simple style
    default:
      return url.replace(`{${param.name}}`, String(paramValue))
  }
}
