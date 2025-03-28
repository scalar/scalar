import { writeFile } from 'node:fs'
import { cookieSchema } from '@/entities/cookie/cookie.ts'
import { environmentSchema } from '@/entities/environment/environment.ts'
import { collectionSchema } from '@/entities/spec/collection.ts'
import { requestExampleSchema } from '@/entities/spec/request-examples.ts'
import { requestSchema } from '@/entities/spec/requests.ts'
import { serverSchema } from '@/entities/spec/server.ts'
import { tagSchema } from '@/entities/spec/spec-objects.ts'
import { workspaceSchema } from '@/entities/workspace/workspace.ts'
import { DATA_VERSION } from '@/migrations/data-version.ts'
import { securitySchemeSchema } from '@scalar/types/entities'
import { createTypeAlias, printNode, zodToTs } from 'zod-to-ts'

console.warn('Make sure the generate types file is updated for the current version')
console.info('Generating...')

const entities = [
  { identifier: 'Collection', schema: collectionSchema },
  { identifier: 'Cookie', schema: cookieSchema },
  { identifier: 'Environment', schema: environmentSchema },
  { identifier: 'Tag', schema: tagSchema },
  { identifier: 'RequestExample', schema: requestExampleSchema },
  { identifier: 'Request', schema: requestSchema },
  { identifier: 'SecurityScheme', schema: securitySchemeSchema },
  { identifier: 'Server', schema: serverSchema },
  { identifier: 'Workspace', schema: workspaceSchema },
]

/**
 * Export the types in a namespace
 * TODO:
 * - go back to typescript compiler api and print pretty types as these ones are optional
 */
let typeString = entities.reduce(
  (prev, { identifier, schema }) => {
    const { node } = zodToTs(schema, identifier)
    const typeAlias = createTypeAlias(node, identifier)
    const nodeString = '  export ' + printNode(typeAlias) + '\n\n'
    return prev + nodeString
  },
  `export namespace v_${DATA_VERSION.replace(/\./g, '_')} {\n`,
)

// Add all types data object
typeString += `
  export type DataRecord = { 
    collections: Record<string, Collection>
    cookies: Record<string, Cookie>
    environments: Record<string, Environment>
    requestExamples: Record<string, RequestExample>
    requests: Record<string, Request>
    securitySchemes: Record<string, SecurityScheme>
    servers: Record<string, Server>
    tags: Record<string, Tag>
    workspaces: Record<string, Workspace>
  }
}
`

// Write to file
writeFile(__dirname + `/v-${DATA_VERSION}/types.generated.ts`, typeString, { flag: 'w' }, (err) =>
  err ? console.error(err) : console.log('Generation complete!'),
)
