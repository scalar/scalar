import { record, string } from '@scalar/validation'

import { createAsyncApiParameterObject } from './parameter'
import { type MaybeRefFn, normalRef } from './reference'

/**
 * Builds the channel/operation parameters map schema for {@link generateSchema}.
 *
 * **Reference union (map values):** Each entry is `Parameter Object | Reference Object` from
 * {@link createAsyncApiParameterObject}. Do not wrap map values in `maybeRef` again.
 *
 * @param maybeRef - `normalRef` or `recursiveRef` from `./reference`.
 */
export const createAsyncApiParametersObject = (maybeRef: MaybeRefFn) => {
  const parameter = createAsyncApiParameterObject(maybeRef)

  return record(string(), parameter, {
    typeName: 'AsyncApiParametersObject',
    typeComment: 'Map of parameter name to Parameter Object or Reference Object.',
  })
}

export const asyncApiParametersObject = createAsyncApiParametersObject(normalRef)
