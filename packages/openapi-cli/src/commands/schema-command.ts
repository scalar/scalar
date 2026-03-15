import type { OpenAPI } from '@scalar/openapi-types'

import { traverseSpec } from '../traverse-spec.js'

export type HelpSchema = {
  verbs: string[]
  verbOptions: { name: string; description?: string }[]
  operations: {
    path: string
    method: string
    resource: string
    action: string
    prefix: string[]
    pathParams: string[]
    queryParams: string[]
    bodyFlags: string[]
  }[]
}

export function buildHelpSchema(spec: OpenAPI.Document): HelpSchema {
  const operations = traverseSpec(spec)
  return {
    verbs: ['get', 'post', 'put', 'patch', 'delete'],
    verbOptions: [
      { name: '-d, --data', description: 'Request body: JSON string, @file path, or - for stdin' },
      { name: '-q, --query', description: 'Query parameter (repeatable)' },
      { name: '-H, --header', description: 'Header (repeatable)' },
      { name: '--output, --json', description: 'Machine-readable output envelope' },
      { name: '--yes, --force', description: 'Non-interactive' },
      { name: '--api-key, --bearer', description: 'Auth (or env API_KEY, BEARER_TOKEN)' },
    ],
    operations: operations.map((op) => ({
      path: op.path,
      method: op.method,
      resource: op.resource,
      action: op.action,
      prefix: op.prefixSegments,
      pathParams: op.pathParams.map((p) => p.name),
      queryParams: op.queryParams.map((p) => p.name),
      bodyFlags: op.bodyFlagKeys,
    })),
  }
}
