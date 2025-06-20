import fs from 'node:fs/promises'
import path from 'node:path'
import { ReferenceConfigSchema } from '../src/schemas/reference-config'

// generate the JSON schema for the ReferenceConfigSchema
await fs.writeFile(
  path.join(__dirname, '../src/schemas/reference-config/reference-config.json'),
  JSON.stringify(ReferenceConfigSchema, null, 2),
)
