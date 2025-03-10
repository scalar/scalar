import { writeFile } from 'node:fs'
import { CookieSchema } from '@/entities/cookie'
import { EnvironmentSchema } from '@/entities/environment'

import { RequestExampleSchema } from '@/entities/spec'
import { ExtendedServerObjectSchema } from '@/entities/specification'
import { CollectionSchema } from '@/entities/specification/collection'
import { ExtendedOperationSchema } from '@/entities/specification/operation-object'
import { ExtendedSecurityRequirementSchema } from '@/entities/specification/security-object'
import { ExtendedTagSchema } from '@/entities/specification/tag-object'
import { workspaceSchema } from '@/entities/workspace'
import { DATA_VERSION } from '@/migrations/data-version'
import { createTypeAlias, printNode, zodToTs } from 'zod-to-ts'

console.warn('Make sure the generate types file is updated for the current version')
console.info('Generating...')

const entities = [
  { identifier: 'Collection', schema: CollectionSchema },
  { identifier: 'Cookie', schema: CookieSchema },
  { identifier: 'Environment', schema: EnvironmentSchema },
  { identifier: 'Tag', schema: ExtendedTagSchema },
  { identifier: 'RequestExample', schema: RequestExampleSchema },
  { identifier: 'Request', schema: ExtendedOperationSchema },
  { identifier: 'SecurityScheme', schema: ExtendedSecurityRequirementSchema },
  { identifier: 'Server', schema: ExtendedServerObjectSchema },
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
