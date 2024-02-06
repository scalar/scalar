import type {
  Cookie,
  HarRequestWithPath,
  Header,
  Query,
  TransformedOperation,
} from '../types'
import { getParametersFromOperation, getRequestBodyFromOperation } from './'

export const getRequestFromOperation = (
  operation: TransformedOperation,
  options?: {
    replaceVariables?: boolean
  },
  selectedExampleKey?: string | number,
): Partial<HarRequestWithPath> => {
  // Replace all variables of the format {something} with the uppercase variable name without the brackets
  let path = operation.path

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
      ...getParametersFromOperation(operation, 'header'),
      ...(requestBody?.headers ?? []),
    ] as Header[],
    // TODO: Sorry, something is off here and I don’t get it.
    // @ts-ignore
    postData: requestBody?.postData,
    queryString: getParametersFromOperation(operation, 'query') as Query[],
    cookies: getParametersFromOperation(operation, 'cookie') as Cookie[],
  }
}
