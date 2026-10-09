import { generateTypes } from '@scalar/validation'

import { generateSchema } from './../src/schemas/v3.2/openapi'
import { normalRef, recursiveRef } from '../src/schemas/v3.2/openapi/reference'

const openapi = generateTypes(generateSchema(normalRef), {
  maxDepth: Number.POSITIVE_INFINITY,
  namespace: 'OpenAPIV3_2',
})

const proxyOpenapi = generateTypes(generateSchema(recursiveRef), {
  maxDepth: Number.POSITIVE_INFINITY,
  namespace: 'OpenAPIV3_2',
})

import fs from 'node:fs/promises'
import path from 'node:path'

await fs.writeFile(path.join(import.meta.dirname, 'openapi-types.ts'), openapi)
await fs.writeFile(path.join(import.meta.dirname, 'openapi-proxy-types.ts'), proxyOpenapi)
