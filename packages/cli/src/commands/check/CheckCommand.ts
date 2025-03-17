import { check } from '@scalar/config'
import { Command } from 'commander'
import kleur from 'kleur'
import fs from 'node:fs'
import path from 'node:path'

import { ERRORS } from '../../libs/errors'
import { CONFIG_FILE } from '../../utils'

/**
 * Lint users scalar configs (scalar.config.json files)
 */
export function CheckCommand() {
  const cmd = new Command('check')

  cmd.description('Check a Scalar Configuration file')
  cmd.argument('[file]', 'File to check')
  cmd.action(async (inputArgument: string) => {
    const startTime = performance.now()

    // Read file
    const file = path.resolve(inputArgument ?? CONFIG_FILE)

    // Check if `scalar.config.json` already exists
    if (!fs.existsSync(file)) {
      console.log()
      console.error(kleur.red().bold('ERROR'))
      console.error(kleur.red('Couldn’t find the Scalar Configuration file:'))
      console.error(kleur.red(file))
      console.log()
      process.exit(1)
    }

    // Validate
    const result = check(file)

    if (result.valid) {
      console.log()
      console.log(kleur.green().bold('SUCCESS'))
      console.log(kleur.green('The Scalar Configuration is valid:'))
      console.log(kleur.green(file))

      const endTime = performance.now()

      console.log()
      console.log(
        kleur.green('Scalar Configuration validated'),
        kleur.grey(`in ${kleur.white(`${kleur.bold(`${Math.round(endTime - startTime)}`)} ms`)}`),
      )
      console.log()
    } else {
      console.log()
      console.error(kleur.red().bold('ERROR'))
      console.error(kleur.red(ERRORS.INVALID_SCALAR_CONFIGURATION))
      console.error(kleur.red(file))
      result.errors?.forEach((error) => {
        console.log()

        if (error.path) {
          console.error(kleur.white(`➜ ${error.path}`))
        }

        if (error.message) {
          console.error(kleur.white(`  ${error.message}`))
        }
      })
      console.log()

      process.exit(1)
    }
  })

  return cmd
}
