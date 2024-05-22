import { cancel, confirm, isCancel, spinner, text } from '@clack/prompts'
import { Command } from 'commander'
import kleur from 'kleur'
import fs from 'node:fs'
import path from 'node:path'

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
    const s = spinner()
    let validInput = false
    let input = file

    const nextSteps = () => {
      console.log('What to do next:')
      console.log(
        `  ${kleur.cyan('scalar format')} ${kleur.gray('[options] [file|url]')} to format your OpenAPI file`,
      )
      console.log(
        `  ${kleur.cyan('scalar validate')} ${kleur.gray('[file|url]')} to validate your OpenAPI file`,
      )
      console.log(
        `  ${kleur.cyan('scalar bundle')} ${kleur.gray('[options] [file]')} to bundle your OpenAPI file`,
      )
      console.log(
        `  ${kleur.cyan('scalar serve')} ${kleur.gray('[options] [file|url]')} to serve your OpenAPI file`,
      )
      console.log()
      console.log(
        kleur.white(
          `Run ${kleur.magenta('scalar --help')} to see all available commands.`,
        ),
      )
      console.log()
    }

    // Handle cancel from the user
    const handleCancel = () => {
      cancel('Operation cancelled.')
      nextSteps()
      process.exit(0)
    }

    // Function to validate file extension
    function isValidFile(filePath) {
      const validExtensions = ['.json', '.yaml', '.yml']
      const extension = path.extname(filePath).toLowerCase()
      return validExtensions.includes(extension)
    }

    if (input && isValidFile(input)) {
      validInput = true
    }

    // Check if `scalar.config.json` already exists
    if (fs.existsSync(configFile)) {
      console.log(
        `${kleur.green('✔')} Found Scalar configuration file: ${kleur.reset().green(`${CONFIG_FILE}`)}`,
      )

      const overwrite = await confirm({
        message: 'Do you want to override the file?',
        initialValue: false,
      })

      if (isCancel(overwrite)) {
        handleCancel()
      }

      if (!overwrite) {
        handleCancel()
      }
    }

    // Ask for the OpenAPI file
    const configuration = {
      references: [],
    }

    // Check if the file option is provided and valid
    if (input) {
      const validExtensions = ['.json', '.yaml', '.yml']
      const extension = path.extname(input).toLowerCase()
      if (!validExtensions.includes(extension)) {
        console.log(
          kleur.red('✖'),
          `Please enter a valid file path ${validExtensions.join(', ')}.`,
        )
      } else {
        validInput = true
      }
    }

    while (!validInput) {
      const response = await text({
        message: `Where is your OpenAPI file? ${kleur.reset().grey('(Add a path to the file)')}`,
        validate(value) {
          if (value.length === 0) return `Value is required!`
        },
      })

      input = response

      if (isCancel(response)) {
        handleCancel()
      }

      if (isValidFile(input)) {
        validInput = true
      } else {
        console.log(
          kleur.red('✖'),
          `Invalid file extension. Expected: ${['.json', '.yaml', '.yml'].join(', ')}.`,
        )
      }
    }

    configuration.references.push({
      name: 'API Reference',
      path: input,
    })

    const content = JSON.stringify(configuration, null, 2)

    // Create `scalar.config.json` file
    s.start('Creating Scalar configuration file...')

    setTimeout(() => {
      fs.writeFileSync(configFile, content)
      s.stop(
        `Scalar configuration file created: ${kleur.reset().green(`${CONFIG_FILE}`)}`,
      )
      console.log()
      nextSteps()
      console.log()
      console.log()
    }, 1000)
  })

  return cmd
}
