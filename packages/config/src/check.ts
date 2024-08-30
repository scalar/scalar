import { Value } from '@sinclair/typebox/value'
import fs from 'node:fs'

import { ScalarConfigType } from './configTypes'

/** check scalar config file using the generated schema */
export function check(filePath: string) {
  const scalarConfigFile = fs.readFileSync(process.cwd() + filePath, 'utf8')
  const scalarConfigJson = JSON.parse(scalarConfigFile)

  const result = Value.Check(ScalarConfigType, scalarConfigJson)
  return {
    valid: result,
    errors: [...Value.Errors(ScalarConfigType, scalarConfigJson)],
  }
}
