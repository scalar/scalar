import { Command } from 'commander'
import kleur from 'kleur'
import prettyjson from 'prettyjson'

import { useGivenFileOrConfiguration } from '../../utils'
import { lint } from './lint'

/**
 * Lint users scalar configs (scalar.config.json files)
 */
export function LintCommand() {
  const cmd = new Command('lint')

  cmd.description('Lint users scalar configs')
  cmd.argument('[file]', 'File to lint')
  cmd.action(async (inputArgument: string) => {
    const startTime = performance.now()

    // Read file
    const input = useGivenFileOrConfiguration(inputArgument)

    // Validate
    const result = lint(input)

    if (result.valid) {
      console.log(kleur.green(`Matches the Scalar config specifications`))

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
      console.log(prettyjson.render(result.data))
      console.log()
      console.error(
        kleur.red('File doesn’t match the Scalar config specification.'),
      )
      console.log()
      console.error(
        kleur.red(
          `${kleur.bold(
            `${result.data?.length} error${
              result.data && result.data.length > 1 ? 's' : ''
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
