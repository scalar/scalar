import fs from 'node:fs'
import path from 'node:path'
import { cancel, confirm, isCancel, text } from '@clack/prompts'
import { Command } from 'commander'
import GithubSlugger from 'github-slugger'
import kleur from 'kleur'

import { CONFIG_FILE } from '../../utils'

/**
 * Scalar configuration file (scalar.config.json)
 */
export type ScalarConfigurationFile = {
  subdomain: string
  references: ScalarReferenceEntry[]
  guides: ScalarGuideEntry[]
}

/**
 * Entry for an API reference
 */
export type ScalarReferenceEntry = {
  name: string
  path: string
}

/**
 * Entry for the guide
 */
export type ScalarGuideEntry = {
  name: string
  sidebar: ScalarSidebarEntry[]
}

/**
 * Entry for the sidebar (folder or page)
 */
export type ScalarSidebarEntry = {
  path?: string
  type: 'folder' | 'page'
  items?: ScalarSidebarEntry[]
}

export function InitCommand() {
  const cmd = new Command('init')

  cmd.description('Create a new `scalar.config.json` file to configure where your OpenAPI file is placed.')
  cmd.option('-f, --file [file]', 'your OpenAPI file')
  cmd.option('-s, --subdomain [url]', 'subdomain to publish on')
  cmd.option('--force', 'override existing configuration')
  cmd.action(async ({ file, subdomain, force }) => {
    // Path to `scalar.config.json` file
    const configFile = path.resolve(CONFIG_FILE)
    let validInput: boolean
    let input = file

    const nextSteps = () => {
      console.log('What to do next:')
      console.log(`  ${kleur.cyan('scalar format')} ${kleur.gray('[options] [file|url]')} to format your OpenAPI file`)
      console.log(`  ${kleur.cyan('scalar validate')} ${kleur.gray('[file|url]')} to validate your OpenAPI file`)
      console.log(`  ${kleur.cyan('scalar bundle')} ${kleur.gray('[options] [file]')} to bundle your OpenAPI file`)
      console.log(`  ${kleur.cyan('scalar serve')} ${kleur.gray('[options] [file|url]')} to serve your OpenAPI file`)
      console.log()
      console.log(kleur.white(`Run ${kleur.magenta('scalar --help')} to see all available commands.`))
    }

    // Handle cancel from the user
    const handleCancel = () => {
      cancel('Operation cancelled.')
      nextSteps()
      process.exit(0)
    }

    // Function to validate file extension
    function isValidFile(filePath: string) {
      const validExtensions = ['.json', '.yaml', '.yml']
      const extension = path.extname(filePath).toLowerCase()
      return validExtensions.includes(extension)
    }

    // Check if `scalar.config.json` already exists
    if (fs.existsSync(configFile)) {
      console.log(`${kleur.green('⚠')} Found existing configuration: ${kleur.reset().green(`${CONFIG_FILE}`)}`)

      if (force) {
        console.log(`${kleur.green('✔')} Overwriting existing file…`)
      }

      const shouldOverwriteExisting =
        force ??
        (await confirm({
          message: 'Do you want to override the file?',
          initialValue: false,
        }))

      if (isCancel(shouldOverwriteExisting)) {
        handleCancel()
      }

      if (!shouldOverwriteExisting) {
        handleCancel()
      }
    }

    // New configuration object
    const configuration: ScalarConfigurationFile = {
      subdomain: '',
      references: {},
      guides: [],
    }

    // Subdomain
    validInput = !!subdomain

    while (!validInput) {
      const response = await text({
        message: 'What’s the name of your project? We’ll use that to create a custom subdomain for you.',
        validate(value: string) {
          if (value.trim().length === 0) {
            return 'You didn’t provide a project name. Please provide a name!'
          }

          return
        },
      })

      // TODO: Check if the subdomain is available

      if (isCancel(response)) {
        handleCancel()
      } else {
        validInput = true
      }

      const slugger = new GithubSlugger()
      const slug = slugger.slug(response.toString())

      subdomain = `${slug}.apidocumentation.com`

      console.log(`${kleur.green('✔')} Subdomain: ${kleur.green(subdomain)}`)
    }

    configuration.subdomain = subdomain.trim()

    // Reference

    // Check if the file option is provided and valid
    if (input) {
      const validExtensions = ['.json', '.yaml', '.yml']
      const extension = path.extname(input).toLowerCase()
      if (!validExtensions.includes(extension)) {
        console.log(kleur.red('✖'), `Please enter a valid file path ${validExtensions.join(', ')}.`)
      }
    }

    // Ask for the file path
    validInput = input && isValidFile(input)

    while (!validInput) {
      const response = await text({
        message: `Where is your OpenAPI file? ${kleur.reset().grey('(Add a path to the file)')}`,
        validate(value: string) {
          if (value.length === 0) {
            return 'Value is required!'
          }

          return
        },
      })

      input = response

      if (isCancel(response)) {
        handleCancel()
      }

      if (isValidFile(input)) {
        validInput = true
      } else {
        console.log(kleur.red('✖'), `Invalid file extension. Expected: ${['.json', '.yaml', '.yml'].join(', ')}.`)
      }
    }

    configuration.references.push({
      name: 'API Reference',
      path: input,
    })

    const content = JSON.stringify(configuration, null, 2)

    // Create `scalar.config.json` file
    fs.writeFileSync(configFile, content)
    console.log(`${kleur.green('✔')} Configuration stored.`)
    console.log()

    console.log(`${kleur.bold().green(`${CONFIG_FILE}`)}`)
    console.log()
    console.log(
      `${kleur.grey(
        content
          .split('\n')
          .map((line) => `  ${line}`)
          .join('\n'),
      )}`,
    )

    console.log()
    nextSteps()
    console.log()
  })

  return cmd
}
