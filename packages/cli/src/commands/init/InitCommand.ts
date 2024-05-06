import { Command } from 'commander'
import { glob } from 'glob'
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
    let validInput = false
    let input = file

    // Handle cancel from the user
    const handleCancel = () => {
      console.log()
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

      const { overwrite } = await prompts(
        {
          type: 'toggle',
          name: 'overwrite',
          message: 'Do you want to override the file?',
          initial: false,
          active: 'yes',
          inactive: 'no',
        },
        { onCancel: handleCancel },
      )

      if (overwrite === false) {
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
      if (validExtensions.includes(extension)) {
        validInput = true
      } else {
        console.log(
          kleur.red('✖'),
          `Please enter a valid file path ${validExtensions.join(', ')}.`,
        )
      }
    }

    while (!validInput) {
      const response = await prompts(
        {
          type: 'autocomplete',
          name: 'input',
          message: `Where is your OpenAPI file? ${kleur.reset().grey('(Use arrow keys or type)')}`,
          initial: false,
          choices: [
            { title: `Current working directory`, value: process.cwd() },
            { title: `Parent directory`, value: `../` },
            { title: `Grand directory`, value: `../../` },
            { title: `Home directory`, value: `~` },
            { title: `Root directory`, value: `/` },
            // Display more suggestions
            { value: `/` },
            { value: `/` },
          ],
          suggest: async (input, _choices) => {
            const cwd = process.cwd()
            const start = (
              input.length === 0 ? cwd : path.resolve(cwd, input)
            ).replace('~', process.env.HOME)
            const files = await glob(`${start}/*`, {
              cwd,
              nodir: false,
            })
            const suggestions = files
              .map((file) => {
                const isDirectory = fs.lstatSync(file).isDirectory()
                const ext = path.extname(file)
                const isSpecFile =
                  ['.json', '.yaml', '.yml'].includes(ext) && !isDirectory
                return {
                  title: path.relative(cwd, file) + (isDirectory ? '/' : ''),
                  value: file,
                  specFile: isSpecFile,
                  isDirectory: isDirectory,
                }
              })
              .filter((item) => item !== null)

            // Sort to put specification file types at the top
            suggestions.sort((a, b) => {
              if (a.specFile === b.specFile) {
                return a.title.localeCompare(b.title)
              }
              return Number(b.specFile) - Number(a.specFile)
            })

            if (
              input.length > 0 &&
              !suggestions.find((s) => s.value === input)
            ) {
              suggestions.unshift({
                title: `${input}`,
                value: input,
                specFile: false,
                isDirectory: false,
              })
            }

            // Limit to 5 entries to leave space for the 'Cancel' option
            const limitedSuggestions = suggestions.slice(0, 6)

            limitedSuggestions.push({
              title: 'Cancel',
              value: 'cancel',
              specFile: false,
              isDirectory: false,
            })

            return limitedSuggestions
          },
        },
        {
          onCancel: handleCancel,
        },
      )

      input = response.input

      // Validate the user's choice after the prompt
      if (input) {
        if (input === 'cancel') {
          process.exit(0)
        }

        if (isValidFile(input)) {
          validInput = true
        } else {
          console.log()
          console.log(
            kleur.red('✖'),
            `Invalid file extension. Expected: ${['.json', '.yaml', '.yml'].join(', ')}.`,
          )
          console.log()
        }
      }
    }

    // Convert absolute path to relative path
    const relativePath = path.relative(process.cwd(), input)
    const formattedRelativePath =
      !relativePath.startsWith('../') && !relativePath.startsWith('/')
        ? `./${relativePath}`
        : relativePath

    configuration.references.push({
      name: 'API Reference',
      path: formattedRelativePath,
    })

    const content = JSON.stringify(configuration, null, 2)

    // Create `scalar.config.json` file
    fs.writeFileSync(configFile, content)

    console.log(
      kleur.green('✔'),
      'Scalar configuration file created:',
      kleur.reset().green(`${CONFIG_FILE}`),
    )
    console.log()
    console.log(
      content
        .trim()
        .split('\n')
        .map((line) => kleur.grey(`  ${line}`))
        .join('\n'),
    )
    console.log()
    console.log(
      kleur.white(
        `Run ${kleur.magenta('scalar --help')} to see all available commands.`,
      ),
    )
    console.log()
  })

  return cmd
}
