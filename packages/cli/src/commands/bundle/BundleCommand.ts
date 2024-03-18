import { Command } from 'commander'
import kleur from 'kleur'
import fs from 'node:fs'
import type { OpenAPI } from 'openapi-types'

import { loadOpenApiFile, useGivenFileOrConfiguration } from '../../utils'

export function BundleCommand() {
  const cmd = new Command('bundle')

  cmd.description('Resolve all references in an OpenAPI file')
  cmd.argument('[file]', 'file to bundle')
  cmd.option('-o, --output <file>', 'output file')
  cmd.action(async (fileArgument: string) => {
    const { output } = cmd.opts()

    const startTime = performance.now()

    const file = useGivenFileOrConfiguration(fileArgument)

    const { specification: newContent } = await loadOpenApiFile(file)

    // Replace file content with newContent
    const cache = []
    const json = JSON.stringify(
      newContent,
      (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (cache.indexOf(value) !== -1) {
            // Circular reference found, discard key
            return
          }
          // Store value in our collection
          cache.push(value)
        }
        return value
      },
      2,
    )

    fs.writeFileSync(output ?? file, json, 'utf8')

    const endTime = performance.now()

    console.log(
      kleur.green('OpenAPI Schema bundled'),
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
