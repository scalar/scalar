/**
 * Generate types for the schemas
 *
 * We dump the types to the types package which is pure types with no dependency on the schemas package.
 */

import { spawnSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

import { generateTypes } from '@scalar/validation'

import { apiReferenceConfigurationSchema } from '../src/api-reference/api-reference-configuration'
import { createAsyncApiObjectSchema } from '../src/asyncapi/3.1/asyncapi-object'
import { recursiveRef } from '../src/asyncapi/3.1/reference'

const generatedAt = new Date().toISOString()

const apiReferenceConfigurationTypes = generateTypes(apiReferenceConfigurationSchema, {
  generatedAt,
  maxDepth: Number.POSITIVE_INFINITY,
  typeName: 'ApiReferenceConfiguration',
})

const asyncApi31Types = generateTypes(createAsyncApiObjectSchema(recursiveRef), {
  generatedAt,
  maxDepth: Number.POSITIVE_INFINITY,
  typeName: 'AsyncApiDocument',
})

const repoRoot = path.join(import.meta.dirname, '../../..')
const typesPackageSrc = path.join(repoRoot, 'packages/types/src')

const genDir = path.join(typesPackageSrc, 'gen')
const asyncApi31Dir = path.join(typesPackageSrc, 'asyncapi/3.1')

const apiReferenceTypesPath = path.join(genDir, 'api-reference.d.ts')
const asyncApi31TypesPath = path.join(asyncApi31Dir, 'index.generated.ts')

await fs.mkdir(genDir, { recursive: true })
await fs.mkdir(asyncApi31Dir, { recursive: true })

await Promise.all([
  fs.writeFile(apiReferenceTypesPath, apiReferenceConfigurationTypes),
  fs.writeFile(asyncApi31TypesPath, asyncApi31Types),
])

const generatedPaths = [path.relative(repoRoot, apiReferenceTypesPath), path.relative(repoRoot, asyncApi31TypesPath)]

const formatResult = spawnSync(
  'pnpm',
  [
    'biome',
    'check',
    '--write',
    '--diagnostic-level=error',
    '--no-errors-on-unmatched',
    '--files-ignore-unknown=true',
    ...generatedPaths,
  ],
  { cwd: repoRoot, stdio: 'inherit' },
)

if (formatResult.status !== 0) {
  process.exit(formatResult.status ?? 1)
}
