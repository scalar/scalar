import { lazy, record, string } from '@scalar/validation'

import { pathItem } from '@/openapi/3.1/path-item'
import { recursiveRef } from '@/openapi/3.1/reference'

export const callback = record(string(), recursiveRef(lazy(() => pathItem)), {
  typeName: 'CallbackObject',
})
