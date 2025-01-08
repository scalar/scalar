import type { Parameter, TransformedOperation } from '@scalar/types/legacy'
import { computed } from 'vue'

export type ParamMap = {
  path: Parameter[]
  query: Parameter[]
  header: Parameter[]
  cookie: Parameter[]
  body: Parameter[]
  formData: Parameter[]
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
      operation.pathParameters.forEach((parameter: Parameter) => {
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
