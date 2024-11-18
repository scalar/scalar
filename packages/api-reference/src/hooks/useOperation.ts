import type { Parameters, TransformedOperation } from '@scalar/types/legacy'
import { computed } from 'vue'

export type ParamMap = {
  path: Parameters[]
  query: Parameters[]
  header: Parameters[]
  body: Parameters[]
  formData: Parameters[]
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
      body: [],
      formData: [],
    }

    if (operation.pathParameters) {
      operation.pathParameters.forEach((parameter: Parameters) => {
        if (parameter.in === 'path') {
          map.path.push(parameter)
        } else if (parameter.in === 'query') {
          map.query.push(parameter)
        } else if (parameter.in === 'header') {
          map.header.push(parameter)
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
