import { isJsonString } from '@scalar/oas-utils'
import { openapi } from '@scalar/openapi-parser'
import { Command } from 'commander'
import kleur from 'kleur'
import fs from 'node:fs'

import { readFile, useGivenFileOrConfiguration } from '../../utils'

export function FormatCommand() {
  const cmd = new Command('format')

  cmd.description('Format an OpenAPI file')
  cmd.argument('[file]', 'file to format')
  cmd.action(async (fileArgument: string) => {
    const startTime = performance.now()

    const file = useGivenFileOrConfiguration(fileArgument)

    const fileContent = readFile(file)

    if (!fileContent) {
      console.error(kleur.red('Couldn’t read file.'))
      process.exit(1)
    }

    const newContent = isJsonString(fileContent)
      ? openapi().load(fileContent).toJson()
      : openapi().load(fileContent).toYaml()

    // Replace file content with newContent
    fs.writeFileSync(file, newContent, 'utf8')

    const endTime = performance.now()

    console.log(
      kleur.green('File formatted'),
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
