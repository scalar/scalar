import { replaceTemplateVariables } from '@/libs/string-template'
import type { RequestExample, RequestPayload } from '@scalar/oas-utils/entities/spec'

/**
 * Populate the query parameters from the example parameters. This is an incomplete implementation that currently
 * only supports the following styles and options:
 *
 * - `form` style with `explode` set to true or false
 *
 * @see https://spec.openapis.org/oas/v3.1.1.html#style-values
 */
export function createFetchQueryParams(
  example: Pick<RequestExample, 'parameters'>,
  env: object,
  // TODO: remove this when example.parameters contains query parameters schema
  request?: RequestPayload,
): URLSearchParams {
  const params = new URLSearchParams()

  const parameterSchemaMap = (request?.parameters ?? []).reduce(
    (acc, param) => {
      if (param.in === 'query') {
        acc[param.name] = param
      }
      return acc
    },
    {} as Record<string, NonNullable<RequestPayload['parameters']>[number]>,
  )

  example.parameters.query.forEach((p) => {
    if (!p.enabled) return

    const schema = parameterSchemaMap[p.key]

    switch (p.type) {
      case 'array': {
        const values = replaceTemplateVariables(p.value ?? '', env).split(/,\ ?/)
        // NOTE: we explicitly check for `false` here because the property is optional and the default serialization behavior is exploded.
        if (schema?.explode === false) {
          const csv = values.join(',')
          params.append(p.key, csv)
        } else {
          values.forEach((value) => {
            params.append(p.key, value.trim())
          })
        }
        break
      }
      default: {
        const value = replaceTemplateVariables(p.value ?? '', env)
        params.append(p.key, value.trim())
        break
      }
    }
  })

  return params
}
