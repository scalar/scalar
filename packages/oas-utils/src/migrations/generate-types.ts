import { workspaceSchema } from '@/entities/workspace'
import { collectionSchema } from '@/entities/workspace/collection'
import { cookieSchema } from '@/entities/workspace/cookie'
import { environmentSchema } from '@/entities/workspace/environment'
import { folderSchema } from '@/entities/workspace/folder'
import { securityScheme } from '@/entities/workspace/security'
import { serverSchema } from '@/entities/workspace/server'
import { requestExampleSchema, requestSchema } from '@/entities/workspace/spec'
import { writeFile } from 'fs'
import { createTypeAlias, printNode, zodToTs } from 'zod-to-ts'

console.warn(
  'Make sure the generate types file is updated for the current version',
)
console.info('Generating...')

const entities = [
  { identifier: 'Collection', schema: collectionSchema },
  { identifier: 'Cookie', schema: cookieSchema },
  { identifier: 'Environment', schema: environmentSchema },
  { identifier: 'Folder', schema: folderSchema },
  { identifier: 'RequestExample', schema: requestExampleSchema },
  { identifier: 'Request', schema: requestSchema },
  { identifier: 'SecurityScheme', schema: securityScheme },
  { identifier: 'Server', schema: serverSchema },
  { identifier: 'Workspace', schema: workspaceSchema },
]

const typeString = entities.reduce((prev, { identifier, schema }) => {
  const { node } = zodToTs(schema, identifier)
  const typeAlias = createTypeAlias(node, identifier)
  const nodeString = 'export ' + printNode(typeAlias) + '\n\n'
  return prev + nodeString
}, '')

// Write to file
writeFile(
  __dirname + '/v-0.0.0/types.generated.ts',
  typeString,
  { flag: 'w' },
  (err) => (err ? console.error(err) : console.log('Generation complete!')),
)
