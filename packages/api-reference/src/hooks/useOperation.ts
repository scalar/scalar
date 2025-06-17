import type { OpenAPIV3_1, TransformedOperation } from '@scalar/types/legacy'
import { isDereferenced } from '@scalar/openapi-types/helpers'
import { computed } from 'vue'

export type ParamMap = {
  path: OpenAPIV3_1.ParameterObject[]
  query: OpenAPIV3_1.ParameterObject[]
  header: OpenAPIV3_1.ParameterObject[]
  cookie: OpenAPIV3_1.ParameterObject[]
  body: OpenAPIV3_1.ParameterObject[]
  formData: OpenAPIV3_1.ParameterObject[]
}

/**
 * This hook is used to generate the parameters for the request from the parameters in the swagger file
 */
export function useOperation(operation: TransformedOperation) {
  const parameterMap = computed(() => {
    const map: ParamMap = {
      path: [],
      query: [],
      header: [],
      cookie: [],
      body: [],
      formData: [],
    }

    if (operation.pathParameters) {
      operation.pathParameters.forEach((parameter: OpenAPIV3_1.ParameterObject) => {
        if (parameter.in === 'path') {
          map.path.push(parameter)
        } else if (parameter.in === 'query') {
          map.query.push(parameter)
        } else if (parameter.in === 'header') {
          map.header.push(parameter)
        } else if (parameter.in === 'cookie') {
          map.cookie.push(parameter)
        } else if (parameter.in === 'body') {
          map.body.push(parameter)
        } else if (parameter.in === 'formData') {
          map.formData.push(parameter)
        }
      })
    }

    const parameters = operation.information?.parameters ?? []

    if (parameters) {
      parameters.forEach((parameter) => {
        if (!isDereferenced(parameter)) {
          return
        }

        if (parameter.in === 'path') {
          map.path.push(parameter)
        } else if (parameter.in === 'query') {
          map.query.push(parameter)
        } else if (parameter.in === 'header') {
          map.header.push(parameter)
        } else if (parameter.in === 'cookie') {
          map.cookie.push(parameter)
        } else if (parameter.in === 'body') {
          map.body.push(parameter)
        } else if (parameter.in === 'formData') {
          map.formData.push(parameter)
        }
      })
    }

    return map
  })

  return {
    parameterMap,
  }
}
