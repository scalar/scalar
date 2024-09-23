import { check } from '@scalar/config'
import { Command } from 'commander'
import kleur from 'kleur'
import prettyjson from 'prettyjson'

import { ERRORS } from '../../libs/errors'
import { useGivenFileOrConfiguration } from '../../utils'

/**
 * Lint users scalar configs (scalar.config.json files)
 */
export function CheckCommand() {
  const cmd = new Command('check')

  cmd.description('Check users scalar configs')
  cmd.argument('[file]', 'File to check')
  cmd.action(async (inputArgument: string) => {
    const startTime = performance.now()

    // Read file
    const input = useGivenFileOrConfiguration(inputArgument)

    // Validate
    const result = check(input)

    if (result) {
      console.log(kleur.green('Success'))
      console.log(kleur.green('The Scalar Configuration is valid.'))

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
      console.log(prettyjson.render(result))
      console.error(kleur.red('Error'))
      console.error(kleur.red(ERRORS.INVALID_SCALAR_CONFIGURATION))
      console.log()
      // console.error(
      //   kleur.red(
      //     `${kleur.bold(
      //       `${result.data?.length} error${
      //         result.data && result.data.length > 1 ? 's' : ''
      //       }`,
      //     )} found.`,
      //   ),
      // )
      console.log()

      process.exit(1)
    }
  })

  return cmd
}
