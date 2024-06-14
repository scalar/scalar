import { openapi } from '@scalar/openapi-parser'
import fs from 'fs'

const base = fs.readFileSync('dist/3.1.yaml', 'utf-8')
const latest = fs.readFileSync('dist/latest.yaml', 'utf-8')

const baseOut = openapi().load(base).toJson()
const latestOut = openapi().load(latest).toJson()

fs.writeFileSync('./dist/3.1.json', baseOut)
fs.writeFileSync('./dist/latest.json', latestOut)
