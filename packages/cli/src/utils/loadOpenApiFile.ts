import { openapi } from '@scalar/openapi-parser'
import kleur from 'kleur'
import fs from 'node:fs'

import { isUrl } from './isUrl'

export async function loadOpenApiFile(input: string) {
  const specification = await getFileOrUrl(input)

  try {
    const result = await openapi().load(specification).resolve()
    const { valid } = result

    // Invalid specification
    if (!valid) {
      console.warn(
        kleur.bold().yellow('[WARN]'),
        kleur.bold().yellow('File doesn’t match the OpenAPI specification.'),
      )

      console.log()

      // Output errors
      result.errors?.forEach((error: any) => {
        console.warn(
          kleur.bold().yellow('[WARN]'),
          kleur.yellow(error.error),
          kleur.yellow(`(${error.path})`),
        )
      })

      console.log()

      return result
    }

    return result
  } catch (error) {
    console.warn(kleur.bold().red('[ERROR]'), kleur.red(error))
    console.log()

    return {
      valid: false,
      version: undefined,
      specification: undefined,
      schema: undefined,
      errors: [
        {
          error: error.message,
          path: '',
        },
      ],
    }
  }
}

/**
 * Pass a file path or URL and get the content of the file.
 */
async function getFileOrUrl(input: string): Promise<string> {
  if (isUrl(input)) {
    const response = await fetch(input)

    if (!response.ok) {
      console.error(
        kleur.bold().red('[ERROR]'),
        kleur.bold().red('Failed to fetch OpenAPI specification from URL.'),
      )

      return ''
    }

    return await response.text()
  }

  if (!fs.existsSync(input)) {
    throw new Error('File not found')
  }

  return fs.readFileSync(input, 'utf-8')
}
