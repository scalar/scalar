import Ajv from 'ajv'
import fs from 'node:fs'

import { ScalarConfigSchema } from './configuration'

const ajv = new Ajv()

/** check scalar config file using the generated schema */
export function check(filePath: string) {
  // Load the JSON file to validate
  const data = fs.readFileSync(process.cwd() + filePath, 'utf8')

  // Create the validate instance using the ScalarConfig type JSON schema
  const validate = ajv.compile(ScalarConfigSchema)

  // Validate the JSON file
  const valid = validate(JSON.parse(data))

  return {
    valid: valid,
    data: validate.errors,
  }
}
