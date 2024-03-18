import type { Parameters, TransformedOperation } from '@scalar/oas-utils'
import { computed } from 'vue'

export type ParamMap = {
  path: Parameters[]
  query: Parameters[]
  header: Parameters[]
  body: Parameters[]
  formData: Parameters[]
}

export type OperationProps = {
  operation: TransformedOperation
}

/**
 * This hook is used to generate the parameters for the request from the parameters in the swagger file
 */
export function useOperation(props: OperationProps) {
  const parameterMap = computed(() => {
    const parameters = props.operation.information?.parameters ?? []
    const map: ParamMap = {
      path: [],
      query: [],
      header: [],
      body: [],
      formData: [],
    }

    if (props.operation.pathParameters) {
      props.operation.pathParameters.forEach((parameter: Parameters) => {
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

    if (parameters) {
      parameters.forEach((parameter: Parameters) => {
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
