import { record, string } from '@scalar/validation'

import { asyncApiParameterObject } from './parameter'
import { normalRef } from './reference'

export const asyncApiParametersObject = record(string(), normalRef(asyncApiParameterObject), {
  typeName: 'AsyncApiParametersObject',
  typeComment: 'Map of parameter name to Parameter Object or Reference Object.',
})
