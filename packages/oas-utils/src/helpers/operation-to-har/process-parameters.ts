import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/parameter'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/path-operations'
import type { ReferenceObject } from '@scalar/workspace-store/schemas/v3.1/strict/reference'
import { isReference, type Dereference } from '@scalar/workspace-store/schemas/v3.1/type-guard'
import type { Request as HarRequest } from 'har-format'

type ProcessedParameters = {
  url: string
  headers: HarRequest['headers']
  queryString: HarRequest['queryString']
  cookies: HarRequest['cookies']
}

/** Ensures we don't have any references in the parameters */
export const deReferenceParams = (params: Dereference<OperationObject>['parameters']): ParameterObject[] => {
  if (isReference(params)) {
    return []
  }
  return (params ?? []).filter((param) => !isReference(param)) as ParameterObject[]
}

/**
 * Process OpenAPI parameters and return the updated properties.
 * Handles path, query, and header parameters with various styles and explode options.
 *
 * @see https://spec.openapis.org/oas/latest.html#style-values
 */
export const processParameters = (
  harRequest: HarRequest,
  parameters: (ParameterObject | ReferenceObject)[],
  example?: unknown,
): ProcessedParameters => {
  // Create copies of the arrays to avoid modifying the input
  const newHeaders = [...harRequest.headers]
  const newQueryString = [...harRequest.queryString]
  let newUrl = harRequest.url

  // Filter out references
  const deReferencedParams = deReferenceParams(parameters)

  for (const param of deReferencedParams) {
    if (!param.in || !param.name) {
      continue
    }

    const paramValue =
      example && typeof example === 'object' ? (example as Record<string, unknown>)[param.name] : undefined

    if (paramValue === undefined) {
      continue
    }

    // Type guard to check if parameter has style and explode properties
    const hasStyle = 'style' in param

    // Set default styles according to OpenAPI 3.1.1 specification
    let style: string
    let explode: boolean

    if (hasStyle && param.style) {
      style = param.style
    } else {
      // Default styles by parameter location
      switch (param.in) {
        case 'path':
          style = 'simple'
          break
        case 'query':
          style = 'form'
          break
        case 'header':
          style = 'simple'
          break
        case 'cookie':
          style = 'form'
          break
        default:
          style = 'simple'
      }
    }

    // Set default explode values according to OpenAPI 3.1.1 specification
    if (hasStyle && param.explode !== undefined) {
      explode = param.explode
    } else {
      // Default explode values by style
      explode = style === 'form' ? true : false
    }

    // Validate style restrictions according to OpenAPI 3.1.1 specification
    if (param.in === 'header' && style !== 'simple') {
      // Headers only support 'simple' style
      style = 'simple'
    }

    if (param.in === 'cookie' && style !== 'form') {
      // Cookies only support 'form' style
      style = 'form'
    }

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
            // SpaceDelimited array: color=blue black brown
            if (Array.isArray(paramValue)) {
              newQueryString.push({ name: param.name, value: (paramValue as unknown[]).join(' ') })
            }
            // SpaceDelimited object: color=R 100 G 200 B 150
            else if (typeof paramValue === 'object' && paramValue !== null) {
              const values = Object.entries(paramValue as Record<string, unknown>)
                .map(([k, v]) => `${k} ${v}`)
                .join(' ')
              newQueryString.push({ name: param.name, value: values })
            }
            break
          }
          case 'pipeDelimited': {
            // PipeDelimited array: color=blue|black|brown
            if (Array.isArray(paramValue)) {
              newQueryString.push({ name: param.name, value: (paramValue as unknown[]).join('|') })
            }
            // PipeDelimited object: color=R|100|G|200|B|150
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
        // Headers only support 'simple' style according to OpenAPI 3.1.1
        if (explode) {
          // Simple explode array: multiple header values
          if (Array.isArray(paramValue)) {
            for (const value of paramValue as unknown[]) {
              newHeaders.push({ name: param.name, value: String(value) })
            }
          }
          // Simple explode object: key=value pairs
          else if (typeof paramValue === 'object' && paramValue !== null) {
            const values = Object.entries(paramValue as Record<string, unknown>)
              .map(([k, v]) => `${k}=${v}`)
              .join(',')
            newHeaders.push({ name: param.name, value: values })
          }
          // Simple explode primitive: single value
          else {
            newHeaders.push({ name: param.name, value: String(paramValue) })
          }
        }
        // Simple no explode: all values joined with commas
        else {
          // Handle array values without explode
          if (Array.isArray(paramValue)) {
            newHeaders.push({ name: param.name, value: (paramValue as unknown[]).join(',') })
          }
          // Handle object values without explode
          else if (typeof paramValue === 'object' && paramValue !== null) {
            const values = Object.entries(paramValue as Record<string, unknown>)
              .map(([k, v]) => `${k},${v}`)
              .join(',')
            newHeaders.push({ name: param.name, value: values })
          }
          // Handle primitive values without explode
          else {
            newHeaders.push({ name: param.name, value: String(paramValue) })
          }
        }
        break
      case 'cookie':
        // Cookies only support 'form' style according to OpenAPI 3.1.1
        if (explode) {
          // Handle array values with explode
          if (Array.isArray(paramValue)) {
            for (const value of paramValue as unknown[]) {
              harRequest.cookies.push({ name: param.name, value: value === null ? 'null' : String(value) })
            }
          }
          // Handle object values with explode
          else if (typeof paramValue === 'object' && paramValue !== null) {
            for (const [key, value] of Object.entries(paramValue as Record<string, unknown>)) {
              harRequest.cookies.push({ name: key, value: value === null ? 'null' : String(value) })
            }
          }
          // Handle primitive values with explode
          else {
            harRequest.cookies.push({ name: param.name, value: paramValue === null ? 'null' : String(paramValue) })
          }
        } else {
          // Handle array values without explode
          if (Array.isArray(paramValue)) {
            const serializedValues = (paramValue as unknown[]).map((v) => (v === null ? 'null' : String(v))).join(',')
            harRequest.cookies.push({ name: param.name, value: serializedValues })
          }
          // Handle object values without explode
          else if (typeof paramValue === 'object' && paramValue !== null) {
            // Handle nested objects by recursively flattening them
            const flattenObject = (obj: Record<string, unknown>): string[] => {
              const result: string[] = []

              for (const [key, value] of Object.entries(obj)) {
                // Recursively flatten nested objects
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                  result.push(key, ...flattenObject(value as Record<string, unknown>))
                }
                // Handle primitive values
                else {
                  result.push(key, value === null ? 'null' : String(value))
                }
              }

              return result
            }

            const values = flattenObject(paramValue as Record<string, unknown>).join(',')
            harRequest.cookies.push({ name: param.name, value: values })
          }
          // Handle primitive values without explode
          else {
            harRequest.cookies.push({ name: param.name, value: paramValue === null ? 'null' : String(paramValue) })
          }
        }
        break
    }
  }

  return {
    url: newUrl,
    headers: newHeaders,
    queryString: newQueryString,
    cookies: harRequest.cookies,
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
  param: ParameterObject,
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
