import fs from 'node:fs'

import { build } from '@scalar/build-tooling/esbuild'
import { normalize, toJson } from '@scalar/openapi-parser'

await build({
  entries: ['./src/index.ts'],
  platform: 'shared',
  onSuccess: () => {
    // Get the package meta data
    const packageFile = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))

    // Get the source files
    const base = fs.readFileSync('src/documents/3.1.yaml', 'utf-8')
    const asyncapiBase = fs.readFileSync('src/documents/asyncapi/3.0.yaml', 'utf-8')

    // Replace the version in the OpenAPI file
    const replaced = base.replace(
      // version: 1.0.0 -> version: 0.2.18
      /version:\s*.*/,
      `version: ${packageFile.version}`,
    )

    // Replace the version in the AsyncAPI file
    const asyncapiReplaced = asyncapiBase.replace(
      // version: 1.0.0 -> version: 0.2.18
      /version:\s*.*/,
      `version: ${packageFile.version}`,
    )

    fs.writeFileSync('dist/3.1.yaml', replaced)
    // Alias
    fs.writeFileSync('dist/latest.yaml', replaced)

    // Ensure asyncapi directory exists
    fs.mkdirSync('dist/asyncapi', { recursive: true })

    fs.writeFileSync('dist/asyncapi/3.0.yaml', asyncapiReplaced)
    // Alias
    fs.writeFileSync('dist/asyncapi/latest.yaml', asyncapiReplaced)

    // Get the updated source files
    const version = fs.readFileSync('dist/3.1.yaml', 'utf-8')
    const latest = fs.readFileSync('dist/latest.yaml', 'utf-8')
    const asyncapiVersion = fs.readFileSync('dist/asyncapi/3.0.yaml', 'utf-8')
    const asyncapiLatest = fs.readFileSync('dist/asyncapi/latest.yaml', 'utf-8')

    // Copy the base files into JSON format as well
    const versionOut = toJson(normalize(version))
    const latestOut = toJson(normalize(latest))
    const asyncapiVersionOut = toJson(normalize(asyncapiVersion))
    const asyncapiLatestOut = toJson(normalize(asyncapiLatest))

    fs.writeFileSync('./dist/3.1.json', versionOut)
    fs.writeFileSync('./dist/latest.json', latestOut)
    fs.writeFileSync('./dist/asyncapi/3.0.json', asyncapiVersionOut)
    fs.writeFileSync('./dist/asyncapi/latest.json', asyncapiLatestOut)

    // Update the package file with the raw json and yaml exports
    packageFile.exports = {
      ...packageFile.exports,
      './3.1.yaml': './dist/3.1.yaml',
      './3.1.json': './dist/3.1.json',
      './latest.yaml': './dist/latest.yaml',
      './latest.json': './dist/latest.json',
      './asyncapi/3.0.yaml': './dist/asyncapi/3.0.yaml',
      './asyncapi/3.0.json': './dist/asyncapi/3.0.json',
      './asyncapi/latest.yaml': './dist/asyncapi/latest.yaml',
      './asyncapi/latest.json': './dist/asyncapi/latest.json',
    }

    fs.writeFileSync('./package.json', JSON.stringify(packageFile, null, 2) + '\n')
  },
})
