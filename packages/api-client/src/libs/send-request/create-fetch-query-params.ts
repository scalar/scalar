import { replaceTemplateVariables } from '@/libs/string-template'
import type { RequestExample } from '@scalar/oas-utils/entities/spec'

/** Populate the query parameters from the example parameters */
export function createFetchQueryParams(
  example: Pick<RequestExample, 'parameters'>,
  env: object,
) {
  const params = new URLSearchParams()
  example.parameters.query.forEach((p) => {
    if (p.enabled) {
      const values =
        p.type === 'array'
          ? replaceTemplateVariables(p.value ?? '', env).split(',')
          : [replaceTemplateVariables(p.value ?? '', env)]
      values.forEach((value) => params.append(p.key, value.trim()))
    }
  })

  return params
}
