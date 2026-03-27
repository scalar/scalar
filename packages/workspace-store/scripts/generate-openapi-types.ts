import { generateTypes } from '@scalar/validation'
import fs from 'node:fs/promises'
import path from 'node:path'

import { generateSchema } from './../src/schemas/v3.1/openapi'
import { normalRef, recursiveRef } from '../src/schemas/v3.1/openapi/reference'

const openapi = generateTypes(generateSchema(normalRef), {
  maxDepth: Number.POSITIVE_INFINITY,
  namespace: 'OpenAPIV3_1',
})

const proxyOpenapi = generateTypes(generateSchema(recursiveRef), {
  maxDepth: Number.POSITIVE_INFINITY,
  namespace: 'OpenAPIV3_1',
})

await fs.writeFile(path.join(import.meta.dirname, 'openapi-types.ts'), openapi)
await fs.writeFile(path.join(import.meta.dirname, 'openapi-proxy-types.ts'), proxyOpenapi)
