import fs from 'node:fs/promises'
import path from 'node:path'

import { ReferenceConfigSchema } from '../src/schemas/reference-config'
import { WorkspaceSpecificationSchema } from '../src/schemas/workspace-specification'

// generate the JSON schema for the ReferenceConfigSchema
await fs.writeFile(
  path.join(__dirname, '../src/schemas/reference-config/reference-config.json'),
  `${JSON.stringify(ReferenceConfigSchema, null, 2)}\n`,
)

// generate the JSON schema for the WorkspaceSpecificationSchema
await fs.writeFile(
  path.join(__dirname, '../src/schemas/workspace-specification/workspace-specification.json'),
  `${JSON.stringify(WorkspaceSpecificationSchema, null, 2)}\n`,
)
