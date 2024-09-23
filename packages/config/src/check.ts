import { Value, type ValueError } from '@sinclair/typebox/value'
import fs from 'node:fs'

import { ScalarConfigType } from './configTypes'

/** check scalar config file using the generated schema */
export function check(file: string) {
  try {
    const scalarConfigFile = fs.readFileSync(file, 'utf8')
    const scalarConfiguration = JSON.parse(scalarConfigFile)

    const result = Value.Check(ScalarConfigType, scalarConfiguration)

    return {
      valid: result,
      errors: [...Value.Errors(ScalarConfigType, scalarConfiguration)],
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
