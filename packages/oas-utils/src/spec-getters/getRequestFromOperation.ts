import type {
  Cookie,
  HarRequestWithPath,
  Header,
  Query,
  TransformedOperation,
} from '../types'
import { getParametersFromOperation } from './getParametersFromOperation'
import { getRequestBodyFromOperation } from './getRequestBodyFromOperation'

export type Parameters = {
  name: string
  example?: any
  examples?: Map<string, any>
}

type ParamMap = {
  path: Parameters[]
  query: Parameters[]
  header: Parameters[]
  body: Parameters[]
  formData: Parameters[]
}

export const getRequestFromOperation = (
  operation: TransformedOperation,
  options?: {
    replaceVariables?: boolean
    requiredOnly?: boolean
    parameters?: ParamMap
  },
  selectedExampleKey?: string | number,
): Partial<HarRequestWithPath> => {
  // Replace all variables of the format {something} with the uppercase variable name without the brackets
  let path = operation.path

  // {id} -> 123
  if (options?.parameters?.path) {
    const pathVariables = path.match(/{(.*?)}/g)

    if (pathVariables) {
      pathVariables.forEach((variable) => {
        const variableName = variable.replace(/{|}/g, '')

        if (options.parameters?.path) {
          const parameter = options.parameters.path.find(
            (param) => param.name === variableName,
          )

          if (parameter) {
            path = path.replace(variable, parameter.example.toString() ?? '')
          }
        }
      })
    }
  }

  // {id} -> __ID__
  if (options?.replaceVariables === true) {
    const pathVariables = path.match(/{(.*?)}/g)

    if (pathVariables) {
      pathVariables.forEach((variable) => {
        const variableName = variable.replace(/{|}/g, '')
        path = path.replace(variable, `__${variableName.toUpperCase()}__`)
      })
    }
  }

  const requestBody = getRequestBodyFromOperation(operation, selectedExampleKey)

  return {
    method: operation.httpVerb.toUpperCase(),
    path,
    headers: [
      ...getParametersFromOperation(operation, 'header', options?.requiredOnly),
      ...(requestBody?.headers ?? []),
    ] as Header[],
    // TODO: Sorry, something is off here and I don’t get it.
    // @ts-ignore
    postData: requestBody?.postData,
    queryString: getParametersFromOperation(
      operation,
      'query',
      options?.requiredOnly,
    ) as Query[],
    cookies: getParametersFromOperation(
      operation,
      'cookie',
      options?.requiredOnly,
    ) as Cookie[],
  }
}
