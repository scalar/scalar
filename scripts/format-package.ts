/**
 * This script formats package.json files in the project. It sorts keys and checks critical fields like
 * licenses and private.
 */
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

import { printColor } from './utility'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type PackageType = 'examples' | 'packages'

/**
 * # Formatting script for package.json files
 * Sorts, defaults and overrides keys as specified in the definitions below
 */

/** List of keys to sort and format */
const restrictedKeys = [
  'name',
  'description',
  'license',
  'author',
  'homepage',
  'bugs',
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
const sortKeys = ['dependencies', 'devDependencies', 'scripts']

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

/** Format a package json file and validate scalar-org linting rules */
async function formatPackage(filepath: string) {
  const file = await fs.readFile(filepath, 'utf-8').catch(() => null)

  if (!file) {
    return
  }

  const data = JSON.parse(file)

  if (data.type !== 'module') {
    printColor(
      'brightRed',
      `Package ${data.name} must be an ESM module with "type"="module"`,
    )
  }
  if (
    !data.name.startsWith('@scalar/') &&
    !data.name.startsWith('@scalar-examples/')
  ) {
    printColor(
      'yellow',
      `Package ${data.name} is not in the @scalar/* or @scalar-examples/* scope.`,
    )
  }

  const unsortedKeys = Object.keys(data).filter(
    (key) => !restrictedKeys.includes(key),
  )

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

  // Validate before sorting
  // Check that required scripts are entered
  validatePackageScripts(formattedData['scripts'], formattedData.name)

  // Sort nested keys alphanumerically
  sortKeys.forEach((key) => {
    if (formattedData[key]) {
      formattedData[key] = sortObjectKeys(formattedData[key])
    }
  })

  if (JSON.stringify(data) !== JSON.stringify(formattedData)) {
    printColor('green', `[${formattedData.name}] package.json formatted`)
  }

  await fs
    .writeFile(filepath, JSON.stringify(formattedData, null, 2) + '\n')
    .catch((err) => console.error(err))
}

async function formatDirectoryPackageFiles(folder: PackageType) {
  const packages = await fs.readdir(__dirname + `/../${folder}`)
  await Promise.all(
    packages.map((dir) =>
      formatPackage(__dirname + `/../${folder}/${dir}/package.json`),
    ),
  )
}
/**
 * Lint all package.json files in the project. Sorts keys and checks critical fields like
 * licenses and private.
 */
const run = async () => {
  await formatDirectoryPackageFiles('packages')
  await formatDirectoryPackageFiles('examples')
}

run()

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
function validatePackageScripts(
  scripts: Record<string, string>,
  packageName: string,
) {
  if (!scripts) {
    printColor('yellow', `WARNING: No scripts detected for ${packageName}`)
    return
  }
  const required = ['lint:fix', 'lint:check', 'types:check']

  required.forEach((scriptName) => {
    const command = scripts[scriptName]

    // Require basic scripts for top level formatting
    if (!command) {
      printColor(
        'yellow',
        `[${packageName}] package.json is missing a required script: ${scriptName}`,
      )
      return
    }
  })
}
