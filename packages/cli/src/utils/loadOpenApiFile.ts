import { openapi } from '@scalar/openapi-parser'
import kleur from 'kleur'
import fs from 'node:fs'

export async function loadOpenApiFile(input: string) {
  const specification = await getFileOrUrl(input)

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
        kleur.bold().yellow('File doesn’t match the OpenAPI specification.'),
      )

      console.log()

      // Loop through result.errors if present
      result.errors?.forEach((error: any) => {
        console.warn(
          kleur.bold().yellow('[WARN]'),
          kleur.yellow(error.error),
          kleur.yellow(`(${error.path})`),
        )
      })

      console.log()
    }
    return result
  } catch (error) {
    console.warn(kleur.bold().red('[ERROR]'), kleur.red(error))
    console.log()
  }
}

/**
 * Check if the input is a URL.
 */
function isUrl(text: string): boolean {
  return text.startsWith('http://') || text.startsWith('https://')
}

/**
 * Pass a file path or URL and get the content of the file.
 */
async function getFileOrUrl(input: string): Promise<string> {
  if (isUrl(input)) {
    console.log(
      kleur.bold().white('[INFO]'),
      kleur.bold().white('Fetching OpenAPI specification from URL…'),
    )

    const response = await fetch(input)

    return await response.text()
  }

  if (!fs.existsSync(input)) {
    throw new Error('File not found')
  }

  return fs.readFileSync(input, 'utf-8')
}
