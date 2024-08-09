import { Value } from '@sinclair/typebox/value'
import fs from 'node:fs'

import { ScalarConfigType } from './configTypes'

/** check scalar config file using the generated schema */
export function check(filePath: string) {
  // Load the JSON file to validate
  const data = fs.readFileSync(process.cwd() + filePath, 'utf8')

  const result = Value.Check(ScalarConfigType, JSON.parse(data))

  if (result) return true
  else return false
}
