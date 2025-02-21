import { load, validate } from '@scalar/openapi-parser'
import { fetchUrls } from '@scalar/openapi-parser/plugins/fetch-urls'
import { readFiles } from '@scalar/openapi-parser/plugins/read-files'
import { Command } from 'commander'
import kleur from 'kleur'
import prettyjson from 'prettyjson'

import { useGivenFileOrConfiguration } from '../../utils'

/**
 * Validate an OpenAPI file against the OpenAPI specifications
 */
export function ValidateCommand() {
  const cmd = new Command('validate')

  cmd.description('Validate an OpenAPI file')
  cmd.argument('[file|url]', 'File or URL to validate')
  cmd.action(async (inputArgument: string) => {
    const startTime = performance.now()

    // Read file
    const input = useGivenFileOrConfiguration(inputArgument)

    // Validate
    const { filesystem } = await load(input, {
      plugins: [fetchUrls(), readFiles()],
    })

    const result = await validate(filesystem)

    if (result.valid && result.version) {
      console.log(
        kleur.green(`Matches the OpenAPI specification${kleur.white(` (OpenAPI ${kleur.bold(result.version)})`)}`),
      )

      const endTime = performance.now()

      console.log()
      console.log(
        kleur.green('File validated'),
        kleur.grey(`in ${kleur.white(`${kleur.bold(`${Math.round(endTime - startTime)}`)} ms`)}`),
      )
      console.log()
    } else {
      console.log(prettyjson.render(result.errors))
      console.log()
      console.error(
        kleur.red(`File does not match the OpenAPI ${result.version ? `${result.version} ` : ''}specification.`),
      )
      console.log()
      console.error(
        kleur.red(
          `${kleur.bold(
            `${result.errors?.length} error${result.errors && result.errors.length > 1 ? 's' : ''}`,
          )} found.`,
        ),
      )
      console.log()

      process.exit(1)
    }
  })

  return cmd
}
