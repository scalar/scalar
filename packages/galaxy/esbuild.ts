import fs from 'node:fs'
import { build } from '@scalar/build-tooling/esbuild'
import { normalize, toJson } from '@scalar/openapi-parser'

await build({
  entries: ['./src/index.ts'],
  platform: 'shared',
  onSuccess: async () => {
    // Get the package meta data
    const packageFile = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))

    // Get the source files
    const base = fs.readFileSync('src/documents/3.1.yaml', 'utf-8')

    // Replace the version in the file
    const replaced = base.replace(
      // version: 1.0.0 -> version: 0.2.18
      /version:\s*.*/,
      `version: ${packageFile.version}`,
    )

    fs.writeFileSync('dist/3.1.yaml', replaced)
    // Alias
    fs.writeFileSync('dist/latest.yaml', replaced)

    // Get the updated source files
    const version = fs.readFileSync('dist/3.1.yaml', 'utf-8')
    const latest = fs.readFileSync('dist/latest.yaml', 'utf-8')

    // Copy the base files into JSON format as well
    const versionOut = toJson(normalize(version))
    const latestOut = toJson(normalize(latest))

    fs.writeFileSync('./dist/3.1.json', versionOut)
    fs.writeFileSync('./dist/latest.json', latestOut)

    // Update the package file with the raw json and yaml exports
    packageFile.exports = {
      ...packageFile.exports,
      './3.1.yaml': './dist/3.1.yaml',
      './3.1.json': './dist/3.1.json',
      './latest.yaml': './dist/latest.yaml',
      './latest.json': './dist/latest.json',
    }

    fs.writeFileSync('./package.json', JSON.stringify(packageFile, null, 2) + '\n')
  },
})
