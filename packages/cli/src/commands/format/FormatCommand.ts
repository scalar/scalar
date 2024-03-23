import { openapi } from '@scalar/openapi-parser'
import { Command } from 'commander'
import kleur from 'kleur'
import fs from 'node:fs'

import { useGivenFileOrConfiguration } from '../../utils'
import { getFileOrUrl } from '../../utils/getFileOrUrl'
import { isUrl } from '../../utils/isUrl'
import { isYamlFileName } from '../../utils/isYamlFileName'

export function FormatCommand() {
  const cmd = new Command('format')

  cmd.description('Format an OpenAPI file')
  cmd.argument('[file|url]', 'File or URL to format')
  cmd.option('-o, --output <file>', 'Output file')
  cmd.action(async (inputArgument: string, { output }: { output?: string }) => {
    const startTime = performance.now()

    const input = useGivenFileOrConfiguration(inputArgument)
    const specification = await getFileOrUrl(input)

    if (!specification) {
      console.error(
        kleur.bold().red('[ERROR]'),
        kleur.red('Couldn’t read file.'),
      )
      process.exit(1)
    }

    const newContent = isYamlFileName(output || input)
      ? openapi().load(specification).toYaml()
      : openapi().load(specification).toJson()

    // Replace file content with newContent
    if (output) {
      fs.writeFileSync(output, newContent, 'utf8')
    } else if (!isUrl(input)) {
      fs.writeFileSync(input, newContent, 'utf8')
    } else {
      console.error(
        kleur.bold().red('[ERROR]'),
        kleur.red(
          'Output file is required for URLs. Try passing --output file flag.',
        ),
      )
      process.exit(1)
    }

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
