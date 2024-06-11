import type {
  Cookie,
  HarRequestWithPath,
  Header,
  Query,
  TransformedOperation,
} from '../types'
import { getParametersFromOperation } from './getParametersFromOperation'
import { getRequestBodyFromOperation } from './getRequestBodyFromOperation'

export const getRequestFromOperation = (
  operation: TransformedOperation,
  options?: {
    /**
     * If the path will be URL encoded, you may want to replace {curlyBrackets} with __UNDERSCORES__ to indicate an
     * variable.
     */
    replaceVariables?: boolean
    requiredOnly?: boolean
  },
  selectedExampleKey?: string | number,
): Partial<HarRequestWithPath> => {
  // Replace all variables of the format {something} with the uppercase variable name without the brackets
  let path = operation.path

  // {id} -> 123
  const pathParameters = getParametersFromOperation(operation, 'path', false)

  if (pathParameters.length) {
    const pathVariables = path.match(/{(.*?)}/g)

    if (pathVariables) {
      pathVariables.forEach((variable) => {
        const variableName = variable.replace(/{|}/g, '')

        if (pathParameters) {
          const parameter = pathParameters.find(
            (param) => param.name === variableName,
          )

          if (parameter?.value) {
            path = path.replace(variable, parameter.value.toString())
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
