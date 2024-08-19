import { openapi } from '@scalar/openapi-parser'
import fs from 'node:fs'

const base = fs.readFileSync('dist/3.1.yaml', 'utf-8')
const latest = fs.readFileSync('dist/latest.yaml', 'utf-8')

// Copy the base files into JSON format as well
const baseOut = await openapi().load(base).toJson()
const latestOut = await openapi().load(latest).toJson()

fs.writeFileSync('./dist/3.1.json', baseOut)
fs.writeFileSync('./dist/latest.json', latestOut)

const packageFile = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))

// Update the package file with the raw json and yaml exports
packageFile.exports = {
  ...packageFile.exports,
  './3.1.yaml': './dist/3.1.yaml',
  './3.1.json': './dist/3.1.json',
  './latest.yaml': './dist/latest.yaml',
  './latest.json': './dist/latest.json',
}

fs.writeFileSync('./package.json', JSON.stringify(packageFile, null, 2))
