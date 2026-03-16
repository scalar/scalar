import fs from 'node:fs'

import { parse } from 'yaml'

const packageFile = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
const base = fs.readFileSync('src/documents/3.1.yaml', 'utf-8')
const asyncapiBase = fs.readFileSync('src/documents/asyncapi/3.0.yaml', 'utf-8')

const replaced = base.replace(/version:\s*.*/, `version: ${packageFile.version}`)
const asyncapiReplaced = asyncapiBase.replace(/version:\s*.*/, `version: ${packageFile.version}`)

fs.writeFileSync('dist/3.1.yaml', replaced)
fs.writeFileSync('dist/latest.yaml', replaced)

fs.mkdirSync('dist/asyncapi', { recursive: true })
fs.writeFileSync('dist/asyncapi/3.0.yaml', asyncapiReplaced)
fs.writeFileSync('dist/asyncapi/latest.yaml', asyncapiReplaced)

const version = fs.readFileSync('dist/3.1.yaml', 'utf-8')
const latest = fs.readFileSync('dist/latest.yaml', 'utf-8')
const asyncapiVersion = fs.readFileSync('dist/asyncapi/3.0.yaml', 'utf-8')
const asyncapiLatest = fs.readFileSync('dist/asyncapi/latest.yaml', 'utf-8')

const toJson = (yamlContent: string) =>
  JSON.stringify(parse(yamlContent, { maxAliasCount: 10000, merge: true }), null, 2)

fs.writeFileSync('./dist/3.1.json', toJson(version))
fs.writeFileSync('./dist/latest.json', toJson(latest))
fs.writeFileSync('./dist/asyncapi/3.0.json', toJson(asyncapiVersion))
fs.writeFileSync('./dist/asyncapi/latest.json', toJson(asyncapiLatest))

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
