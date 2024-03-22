import kleur from 'kleur'

import { readFile } from './readFile'

export const CONFIG_FILE = 'scalar.config.json'

export function useGivenFileOrConfiguration(file?: string) {
  // If a specific file is given, use it.
  if (file) {
    return file
  }

  // Try to load the configuration
  try {
    // check if file exists

    const content = readFile(CONFIG_FILE)
    const configuration = JSON.parse(content)

    if (configuration?.reference?.file) {
      return configuration.reference.file
    }
  } catch {
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
