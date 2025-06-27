import fs from 'node:fs/promises'
import path from 'node:path'
import prettier from 'prettier'

import { getWorkspaceRoot } from '@/helpers'
import as from 'ansis'
import { Command } from 'commander'

const command = new Command('format')

command.action(async () => {
  const root = getWorkspaceRoot()

  /**
   * Lint all package.json files in the project. Sorts keys and checks critical fields like
   * licenses and private.
   */
  await formatDirectoryPackageFiles('packages', root)
  await formatDirectoryPackageFiles('integrations', root)
  await formatDirectoryPackageFiles('projects', root)
  await formatDirectoryPackageFiles('examples', root)

  console.log(as.green('✔ All package.json files were formatted'))
})

export default command

// ---------------------------------------------------------------------------

type PackageType = 'packages' | 'integrations' | 'projects' | 'examples'

export async function formatJson(json: string) {
  const filePath = `${getWorkspaceRoot()}/.prettierrc`
  const options = await prettier.resolveConfig(filePath)

  return prettier
    .format(json, {
      filepath: filePath,
      ...options,
      plugins: [],
    })
    .catch((err) => {
      console.error(as.red('Formatting error: '), err.cause)
      return json
    })
}

/**
 * # Formatting script for package.json files
 * Sorts, defaults and overrides keys as specified in the definitions below
 */

/** While we strive to make everything ESM, we just accept that some packages aren't ESM. */
const NO_MODULE_PACKAGES = [
  'scalar-app',
  '@scalar/docusaurus',
  '@scalar-examples/docusaurus',
  '@scalar-examples/nestjs-api-reference-express',
  '@scalar-examples/nestjs-api-reference-fastify',
]

/** List of keys to sort and format */
const restrictedKeys = [
  'name',
  'description',
  'license',
  'author',
  'homepage',
  'bugs',
  'repository',
  'keywords',
  'version',
  'private',
  'engines',
  'packageManager',
  'scripts',
  'type',
  'main',
  'types',
  'exports',
  'files',
  'UNSORTED',
  'dependencies',
  'devDependencies',
  'peerDependencies',
]

/** Sort nested keys in these fields */
const sortKeys = ['dependencies', 'devDependencies', 'peerDependencies', 'scripts']

/** Provide hardcoded overrides for some fields */
const overrides: Record<string, unknown> = {
  license: 'MIT',
  author: 'Scalar (https://github.com/scalar)',
  bugs: 'https://github.com/scalar/scalar/issues/new/choose',
  homepage: 'https://github.com/scalar/scalar',
}

/** Provide default values for some fields */
const fallbacks: Record<string, unknown> = {
  engines: {
    node: '>=20',
  },
}

/** Format a package json file and validate scalar linting rules */
async function formatPackage(filepath: string) {
  const root = getWorkspaceRoot()
  const file = await fs.readFile(filepath, 'utf-8').catch(() => null)

  if (!file) return

  const data = JSON.parse(file)

  if (data.type !== 'module' && !NO_MODULE_PACKAGES.includes(data.name)) {
    as.redBright(`Package ${data.name} must be an ECMAScript module with "type": "module"`)
  }
  if (!data.name.startsWith('@scalar/') && !data.name.startsWith('@scalar-examples/')) {
    as.yellow(`Package ${data.name} is not in the @scalar/* or @scalar-examples/* scope.`)
  }

  // Ensure all peers are installed as dev dependencies to handle turbo order
  Object.entries(data.peerDependencies || {}).forEach(([key, peer]) => {
    data.devDependencies[key] = peer
  })

  const unsortedKeys = Object.keys(data).filter((key) => !restrictedKeys.includes(key))

  const formattedData: Record<string, any> = {}

  restrictedKeys.forEach((key) => {
    if (key === 'UNSORTED') {
      // Add in all unsorted keys at a designated sort point
      unsortedKeys.forEach((uKey) => {
        formattedData[uKey] = data[uKey]
      })
    } else {
      // Either assign the override or the data in sorted order
      const value = overrides[key] ?? data[key] ?? fallbacks[key]
      if (value) {
        formattedData[key] = value
      }
    }
  })

  // Repository URL
  const directory = path.relative(root, path.dirname(filepath))
  // console.log(directory)
  formattedData['repository'] = {
    type: 'git',
    url: 'git+https://github.com/scalar/scalar.git',
    directory,
  }

  // Validate before sorting
  // Check that required scripts are entered
  validatePackageScripts(formattedData.scripts, formattedData.name)

  // Sort nested keys alphanumerically
  sortKeys.forEach((key) => {
    if (formattedData[key]) {
      formattedData[key] = sortObjectKeys(formattedData[key])
    }
  })

  if (JSON.stringify(data) !== JSON.stringify(formattedData)) {
    console.log(as.green(`Package file at ${filepath} was formatted`))
  } else {
    return
  }

  const formatted = await formatJson(JSON.stringify(formattedData, null, 2))
  await fs.writeFile(filepath, formatted).catch((err) => console.error(err))
}

async function formatDirectoryPackageFiles(folder: PackageType, root: string) {
  const packages = await fs.readdir(path.resolve(root, folder))
  await Promise.all(packages.map((dir) => formatPackage(path.resolve(root, folder, dir, 'package.json'))))
}

// ---------------------------------------------------------------------------
// Helpers

/** Sort object keys alphanumerically */
function sortObjectKeys(obj: Record<string, any>) {
  const sorted: Record<string, any> = {}
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = obj[key]
    })

  return sorted
}

/** Validate that required package scripts exists */
function validatePackageScripts(scripts: Record<string, string>, packageName: string) {
  if (!scripts) {
    console.log(as.yellow(`WARNING: No scripts detected for ${packageName}`))
    return
  }
  const required: string[] = ['types:check']
  required.forEach((scriptName) => {
    const command = scripts[scriptName]

    // Require basic scripts for top level formatting
    if (!command) {
      console.log(as.yellow(`Package file is missing the required script ${scriptName} in ${packageName}`))
      return
    }

    // Ensure python packages have linters and formatters setup
    if (
      scriptName === 'lint:fix' &&
      (command.includes('poetry') || command.includes('python')) &&
      (!command.includes('black') || !command.includes('ruff'))
    ) {
      console.log(as.red(`Python package ${packageName} MUST have ruff and black configured for linting`))
    }
  })
}
