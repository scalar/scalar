import {
  type RequestExample,
  type RequestExampleParameter,
  createRequestExampleParameter,
} from '@scalar/oas-utils/entities/workspace/spec'
import type { Path } from '@scalar/object-utils/nested'

/**
 * Uses the new, and old URL values to update/create/delete path params
 */
export const syncPathParamsFromURL = <P extends Path<RequestExample>>(
  newURL?: string,
  oldURL?: string,
  pathParams: RequestExampleParameter[] = [],
): { key: P; value: string | RequestExampleParameter[] } | null => {
  if (!newURL || !oldURL) return null

  const newArr = newURL.split('/')
  const oldArr = oldURL.split('/')

  // Find out which path param changed and update it on the instance
  for (let index = 0; index < newArr.length; index++) {
    const _newURL = newArr[index]
    const _oldURL = oldArr[index]
    if (
      _newURL &&
      _oldURL &&
      (_newURL[0] + _oldURL[0] + '').includes(':') &&
      _newURL !== _oldURL
    ) {
      const oldKey = _oldURL.replace(/^:/, '')
      const newKey = _newURL.replace(/^:/, '')

      // Create new param
      if (_oldURL === ':' || (_newURL[0] === ':' && _oldURL[0] !== ':')) {
        return {
          key: 'parameters.path' as P,
          value: [
            ...pathParams,
            createRequestExampleParameter({ key: newKey }),
          ],
        }
      }
      // Delete param
      else if (_newURL === ':' || (_newURL[0] !== ':' && _oldURL[0] === ':')) {
        return {
          key: 'parameters.path' as P,
          value: [...pathParams.filter((param) => param.key !== oldKey)],
        }
      }
      // Update a param
      else if (pathParams?.length) {
        const rowIndex = pathParams.findIndex((param) => param.key === oldKey)

        if (rowIndex > -1) {
          return {
            key: `parameters.path.${rowIndex}.key` as P,
            value: newKey,
          }
        }
      }
    }
  }

  return null
}
