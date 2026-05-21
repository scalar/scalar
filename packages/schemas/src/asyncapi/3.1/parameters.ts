import { record, string } from '@scalar/validation'

import { asyncApiParameterObject } from './parameter'

export const asyncApiParametersObject = record(string(), asyncApiParameterObject, {
  typeName: 'AsyncApiParametersObject',
  typeComment: 'Map of parameter name to Parameter Object or Reference Object.',
})
