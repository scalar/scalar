import type { Request as RequestEntity } from '@scalar/oas-utils/entities/spec'
import { computed } from 'vue'

export type ParamMap = {
  path: RequestEntity['parameters']
  query: RequestEntity['parameters']
  header: RequestEntity['parameters']
  body: RequestEntity['requestBody']
  formData: RequestEntity['parameters']
}

/**
 * This hook is used to generate the parameters for the request from the parameters in the swagger file
 * @deprecated TODO: REMOVE, use the store instead
 */
export function useParameters(operation: RequestEntity) {
  const parameterMap = computed(() => {
    const map: ParamMap = {
      path: [],
      query: [],
      header: [],
      body: [],
      formData: [],
    }

    // if (operation.pathParameters) {
    //   operation.pathParameters.forEach((parameter: Parameter) => {
    //     if (parameter.in === 'path') {
    //       map.path.push(parameter)
    //     } else if (parameter.in === 'query') {
    //       map.query.push(parameter)
    //     } else if (parameter.in === 'header') {
    //       map.header.push(parameter)
    //     } else if (parameter.in === 'body') {
    //       map.body.push(parameter)
    //     } else if (parameter.in === 'formData') {
    //       map.formData.push(parameter)
    //     }
    //   })
    // }

    const parameters = operation.parameters ?? []

    if (parameters) {
      parameters.forEach((parameter) => {
        if (parameter === undefined) return

        if (parameter.in === 'path') {
          map.path?.push(parameter)
        } else if (parameter.in === 'query') {
          map.query?.push(parameter)
        } else if (parameter.in === 'header') {
          map.header?.push(parameter)
        }
      })
    }

    return map
  })

  return {
    parameterMap,
  }
}
