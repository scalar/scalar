import { computed } from 'vue'

import type { Operation, Parameters } from '../types'

export type ParamMap = {
  path: Parameters[]
  query: Parameters[]
  header: Parameters[]
}

export type OperationProps = {
  operation: Operation
}

/**
 * This hook is used to generate the parameters for the request from the parameters in the swagger file
 */
export function useOperation(props: OperationProps) {
  const parameterMap = computed(() => {
    const { parameters } = props.operation.information
    const map: ParamMap = {
      path: [],
      query: [],
      header: [],
    }
    if (parameters) {
      parameters.forEach((parameter: Parameters) => {
        if (parameter.in === 'path') {
          map.path.push(parameter)
        } else if (parameter.in === 'query') {
          map.query.push(parameter)
        } else if (parameter.in === 'header') {
          map.header.push(parameter)
        }
      })
    }
    return map
  })

  return {
    parameterMap,
  }
}
