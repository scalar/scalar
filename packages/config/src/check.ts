import { Value, type ValueError } from '@sinclair/typebox/value'
import fs from 'node:fs'

import { ScalarConfigType } from './configTypes'

/** check scalar config file using the generated schema */
export function check(file: string) {
  try {
    const scalarConfigFile = fs.readFileSync(file, 'utf8')
    const scalarConfigJson = JSON.parse(scalarConfigFile)

    const result = Value.Check(ScalarConfigType, scalarConfigJson)

    return {
      valid: result,
      errors: [...Value.Errors(ScalarConfigType, scalarConfigJson)],
    }
  } catch (error: any) {
    return {
      valid: false,
      errors: [
        {
          message: error.message,
        } as ValueError,
      ],
    }
  }
}
