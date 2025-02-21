import { load, validate } from '@scalar/openapi-parser'
import { fetchUrls } from '@scalar/openapi-parser/plugins/fetch-urls'
import { readFiles } from '@scalar/openapi-parser/plugins/read-files'
import { Command } from 'commander'
import kleur from 'kleur'
import prettyjson from 'prettyjson'

import { useGivenFileOrConfiguration } from '../../utils'

const validateFile = async (filePath: string) => {
  const { filesystem } = await load(filePath, {
    plugins: [fetchUrls(), readFiles()],
  })

  return validate(filesystem)
}

/**
 * Validate an OpenAPI file against the OpenAPI specifications
 */
export function ValidateCommand() {
  const cmd = new Command('validate')

  cmd.description('Validate an OpenAPI file')
  cmd.argument('[file|url]', 'File or URL to validate')
  cmd.action(async (inputArgument: string) => {
    const startTime = performance.now()

    // Get file paths
    const paths = useGivenFileOrConfiguration(inputArgument)

    for (const path of paths) {
      const validationResult = await validateFile(path);

      if (!validationResult.valid) {
        console.log(prettyjson.render(validationResult.errors))
        console.log()
        console.error(
          kleur.red(
            `File does not match the OpenAPI ${validationResult.version ? `${validationResult.version} ` : ''}specification.`,
          ),
        )
        console.log()
        console.error(
          kleur.red(
            `${kleur.bold(
              `${validationResult.errors?.length} error${validationResult.errors && validationResult.errors.length > 1 ? 's' : ''
              }`,
            )} found.`,
          ),
        )
        console.log()

        process.exit(1)
      }
    }

    const endTime = performance.now()

    console.log()
    console.log(
      kleur.green(`${paths.length > 1 ? "Files" : "File"} validated`),
      kleur.grey(
        `in ${kleur.white(
          `${kleur.bold(`${Math.round(endTime - startTime)}`)} ms`,
        )}`,
      ),
    )
    console.log()

  })

  return cmd
}
