import kleur from 'kleur'
import { readFile } from './readFile'
import { check, type ScalarConfig } from '@scalar/config'
import { ERRORS } from '../libs/errors'

export const CONFIG_FILE = 'scalar.config.json'

export function useGivenFileOrConfiguration(file?: string) {
  // If a specific file is given, use it.
  if (file) {
    return [file]
  }

  // Try to load the configuration
  try {
    const config = readFile(CONFIG_FILE)

    if (!config) {
      throw new Error('No configuration file found.')
    }

    if (!check(CONFIG_FILE).valid) {
      console.error(kleur.red(ERRORS.INVALID_SCALAR_CONFIGURATION))
      return process.exit(1)
    }

    const configuration = JSON.parse(config) as ScalarConfig

    if (configuration.references.length > 0) {
      return configuration.references.map(it => it.path)
    }

  } catch(err) {
    // Do nothing
  }

  console.error(kleur.red('No file provided.'))
  console.log()
  console.log(
    kleur.white(
      'Try `scalar init` or add the file as an argument. Read `scalar --help` for more information.',
    ),
  )
  console.log()

  return process.exit(1)
}
