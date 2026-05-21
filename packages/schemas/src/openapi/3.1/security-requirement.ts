import { array, record, string } from '@scalar/validation'

export const securityRequirement = record(string(), array(string()), {
  typeName: 'SecurityRequirementObject',
  typeComment:
    'Lists the required security schemes to execute this operation. An empty object ({}) indicates anonymous access is supported.',
})
