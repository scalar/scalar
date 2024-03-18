import { Command } from 'commander'
import kleur from 'kleur'
import fs from 'node:fs'
import path from 'node:path'
import prompts from 'prompts'

import { CONFIG_FILE } from '../../utils'

export function InitCommand() {
  const cmd = new Command('init')

  cmd.description(
    'Create a new `scalar.config.json` file to configure where your OpenAPI file is placed.',
  )
  cmd.option('-f, --file [file]', 'your OpenAPI file')
  cmd.action(async ({ file }) => {
    // Path to `scalar.config.json` file
    const configFile = path.resolve(CONFIG_FILE)

    // Check if `scalar.config.json` already exists
    if (fs.existsSync(configFile)) {
      console.warn(kleur.yellow(`A ${CONFIG_FILE} file already exists.`))
      console.log()

      const { overwrite } = await prompts({
        type: 'toggle',
        name: 'overwrite',
        message: 'Do you want to override the file?',
        initial: false,
        active: 'yes',
        inactive: 'no',
      })

      if (overwrite === false) {
        console.log()
        process.exit(1)
      }
    }

    // Ask for the OpenAPI file
    const configuration = {
      references: [],
    }

    const { input } = file
      ? {
          input: file,
        }
      : await prompts({
          type: 'text',
          name: 'input',
          message: 'Where is your OpenAPI file?',
          initial: './openapi.json',
          validate: (input: string) => {
            return fs.existsSync(input) ? true : 'File doesn’t exist.'
          },
        })

    configuration.references.push({
      name: 'API Reference',
      path: input,
    })

    const content = JSON.stringify(configuration, null, 2)

    console.log()
    console.log(kleur.bold().white(`    ${CONFIG_FILE}`))
    console.log()
    console.log(
      content
        .trim()
        .split('\n')
        .map((line) => kleur.grey(`    ${line}`))
        .join('\n'),
    )
    console.log()

    // Create `scalar.config.json` file
    fs.writeFileSync(configFile, content)

    console.log(kleur.green('Created a new project configuration.'))
    console.log(
      kleur.white(
        `Run ${kleur
          .grey()
          .bold('scalar --help')} to see all available commands.`,
      ),
    )
    console.log()
  })

  return cmd
}
