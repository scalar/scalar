import type { BaseParameter } from '@scalar/api-client'

import type { Parameters } from '../types'

/**
 * Generate parameters for the request from the parameters in the swagger file
 */
export function generateParameters(parameters: Parameters[]) {
  const params: BaseParameter[] = []
  parameters.forEach((parameter: Parameters) => {
    const param: BaseParameter = {
      name: parameter.name,
      value: '',
      customClass: parameter.required ? 'required-parameter' : '',
      enabled: true,
    }
    param.value = ''
    params.push(param)
  })

  return params
}
