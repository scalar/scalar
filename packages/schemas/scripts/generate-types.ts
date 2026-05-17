/**
 * Generate types for the schemas
 *
 * We dump the types to the types package which is pure types with no dependency on the schemas package.
 */

import fs from 'node:fs/promises'
import path from 'node:path'

import { generateTypes } from '@scalar/validation'

import { apiReferenceConfigurationSchema } from '../src/api-reference/api-reference-configuration'
import { generateSchema } from '../src/openapi/3.1/index'
import { recursiveRef } from '../src/openapi/3.1/reference'

const generatedAt = new Date().toISOString()

const apiReferenceConfigurationTypes = generateTypes(apiReferenceConfigurationSchema, {
  generatedAt,
  maxDepth: Number.POSITIVE_INFINITY,
  typeName: 'ApiReferenceConfiguration',
})

const openApi31Types = generateTypes(generateSchema(recursiveRef), {
  generatedAt,
  maxDepth: Number.POSITIVE_INFINITY,
  typeName: 'OpenApiDocument',
})

const typesPackageSrc = path.join(import.meta.dirname, '../../types/src')

const genDir = path.join(typesPackageSrc, 'gen')
const openApi31Dir = path.join(typesPackageSrc, 'openapi/3.1')

await fs.mkdir(genDir, { recursive: true })
await fs.mkdir(openApi31Dir, { recursive: true })

await Promise.all([
  fs.writeFile(path.join(genDir, 'api-reference.d.ts'), apiReferenceConfigurationTypes),
  fs.writeFile(path.join(openApi31Dir, 'index.generated.ts'), openApi31Types),
])
