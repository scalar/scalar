import { openapi } from '@scalar/openapi-parser'
import { Command } from 'commander'
import kleur from 'kleur'
import fs from 'node:fs'
import prettyjson from 'prettyjson'

import { useGivenFileOrConfiguration } from '../../utils'

export function ValidateCommand() {
  const cmd = new Command('validate')

  cmd.description('Validate an OpenAPI file')
  cmd.argument('[file]', 'file to validate')
  cmd.action(async (fileArgument: string) => {
    const startTime = performance.now()

    // Read file
    const file = useGivenFileOrConfiguration(fileArgument)
    // TODO: Doesn’t work with URLs
    const specification = fs.readFileSync(file, 'utf8')

    // Validate
    const result = await openapi().load(specification).validate()

    if (result.valid) {
      console.log(
        kleur.green(
          `Matches the OpenAPI specification${kleur.white(
            ` (OpenAPI ${kleur.bold(result.version)})`,
          )}`,
        ),
      )

      const endTime = performance.now()

      console.log()
      console.log(
        kleur.green('File validated'),
        kleur.grey(
          `in ${kleur.white(
            `${kleur.bold(`${Math.round(endTime - startTime)}`)} ms`,
          )}`,
        ),
      )
      console.log()
    } else {
      console.log(prettyjson.render(result.errors))
      console.log()
      console.error(kleur.red('File doesn’t match the OpenAPI specification.'))
      console.log()
      console.error(
        kleur.red(
          `${kleur.bold(
            `${result.errors?.length} error${
              result.errors && result.errors.length > 1 ? 's' : ''
            }`,
          )} found.`,
        ),
      )
      console.log()

      process.exit(1)
    }
  })

  return cmd
}
