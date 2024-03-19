import { openapi } from '@scalar/openapi-parser'
import kleur from 'kleur'
import fs from 'node:fs'

export async function loadOpenApiFile(file: string) {
  const specification = fs.readFileSync(file, 'utf8')

  try {
    const result = await openapi().load(specification).resolve()
    const { valid, version, schema } = result

    if (valid) {
      console.log(
        kleur.bold().white('[INFO]'),
        kleur.bold().white(schema.info.title),
        kleur.grey(`(OpenAPI v${version})`),
      )
      // Stats
      const pathsCount = Object.keys(schema.paths).length

      let operationsCount = 0
      for (const path in schema.paths) {
        for (const method in schema.paths[path]) {
          operationsCount++
        }
      }

      console.log(
        kleur.bold().white('[INFO]'),
        kleur.grey(`${pathsCount} paths, ${operationsCount} operations`),
      )

      console.log()
    } else {
      console.warn(
        kleur.bold().yellow('[WARN]'),
        kleur.yellow('File doesn’t match the OpenAPI specification.'),
      )
      console.log()
    }
    return result
  } catch (error) {
    console.warn(kleur.bold().red('[ERROR]'), kleur.red(error))
    console.log()
  }
}
