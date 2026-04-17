/**
 * Generate types for the schemas
 *
 * We will dumb the types to the types package which is going to be pure types with no dependencies on the schemas package
 */

import { generateTypes } from '@scalar/validation'
import fs from 'node:fs/promises'
import path from 'node:path'
import { apiReferenceConfigurationSchema } from '../src/api-reference/api-reference-configuration'

/** Generate the types */
const apiReferenceConfigurationTypes = generateTypes(apiReferenceConfigurationSchema, {
  generatedAt: new Date().toISOString(),
  maxDepth: Number.POSITIVE_INFINITY,
  typeName: 'ApiReferenceConfiguration',
})

/** Write the types to the types package */
const outDir = path.join(import.meta.dirname, '../../types/src/gen')
// Create the directory if it doesn't exist
await fs.mkdir(outDir, { recursive: true })
await fs.writeFile(path.join(outDir, 'api-reference.d.ts'), apiReferenceConfigurationTypes)
