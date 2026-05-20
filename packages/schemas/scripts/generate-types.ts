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
import { GENERATED_TYPE_OUTPUT_PATHS, getGeneratedTypeAbsolutePaths, getRepoRoot } from './generated-type-paths'

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

const repoRoot = getRepoRoot()
const generatedTypeAbsolutePaths = getGeneratedTypeAbsolutePaths(repoRoot)
const apiReferenceTypesPath = generatedTypeAbsolutePaths[0]
const asyncApi31TypesPath = generatedTypeAbsolutePaths[1]

await Promise.all([
  fs.mkdir(path.dirname(apiReferenceTypesPath), { recursive: true }),
  fs.mkdir(path.dirname(asyncApi31TypesPath), { recursive: true }),
])

await Promise.all([
  fs.writeFile(apiReferenceTypesPath, apiReferenceConfigurationTypes),
  fs.writeFile(asyncApi31TypesPath, asyncApi31Types),
])

const formatResult = spawnSync(
  'pnpm',
  [
    'biome',
    'check',
    '--write',
    '--diagnostic-level=error',
    '--no-errors-on-unmatched',
    '--files-ignore-unknown=true',
    ...GENERATED_TYPE_OUTPUT_PATHS,
  ],
  { cwd: repoRoot, stdio: 'inherit' },
)

if (formatResult.status !== 0) {
  process.exit(formatResult.status ?? 1)
}
