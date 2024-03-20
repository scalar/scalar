import type { ResolvedOpenAPI } from '@scalar/openapi-parser'
import kleur from 'kleur'

export function printSpecificationBanner(result: {
  version: string
  schema: ResolvedOpenAPI.Document
}) {
  const { version, schema } = result

  // Version
  console.log(
    kleur.bold().white('[INFO]'),
    kleur.bold().white(schema.info.title),
    kleur.grey(`(OpenAPI v${version})`),
  )

  // Count number of paths
  const pathsCount = Object.keys(schema.paths).length

  // Count number of operations
  const operationsCount = Object.values(schema.paths).reduce(
    (acc, path) => acc + Object.keys(path).length,
    0,
  )

  // Statistics
  console.log(
    kleur.bold().white('[INFO]'),
    kleur.grey(`${pathsCount} paths, ${operationsCount} operations`),
  )

  console.log()
}
