import type { BaseParameter, Parameters } from '@scalar/types/legacy'

/**
 * Generate parameters for the request from the parameters in the swagger file
 */
export function generateParameters(parameters: Parameters[]) {
  const params: BaseParameter[] = []
  parameters.forEach((parameter: Parameters) => {
    const param: BaseParameter = {
      name: parameter.name,
      value: '',
      required: parameter.required,
      enabled: true,
    }
    param.value = ''
    params.push(param)
  })

  return params
}
