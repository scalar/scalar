import { load, validate } from '@scalar/openapi-parser'
import kleur from 'kleur'

import { getFileOrUrl } from './getFileOrUrl'

export async function loadOpenApiFile(input: string) {
  const specification = await getFileOrUrl(input)

  try {
    const { filesystem } = await load(specification)
    const result = await validate(filesystem)

    // Invalid specification
    if (!result.valid) {
      console.warn(kleur.bold().yellow('[WARN]'), kleur.bold().yellow('File doesn’t match the OpenAPI specification.'))

      console.log()

      // Output errors
      result.errors?.forEach((error: any) => {
        console.warn(kleur.bold().yellow('[WARN]'), kleur.yellow(error.error), kleur.yellow(`(${error.path})`))
      })

      console.log()

      return result
    }

    return result
  } catch (error: unknown) {
    console.warn(kleur.bold().red('[ERROR]'), error ? kleur.red(error.toString()) : 'Unknown error.')
    console.log()

    const message = typeof error === 'object' && error !== null && 'message' in error ? error.message : 'Unknown error'

    return {
      valid: false,
      version: undefined,
      specification: undefined,
      schema: undefined,
      errors: [
        {
          error: message,
          path: '',
        },
      ],
    }
  }
}
