import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { RequestBodyObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/parameter'
import type { ResponseObject } from '@scalar/workspace-store/schemas/v3.1/strict/response'
import type { ResponsesObject } from '@scalar/workspace-store/schemas/v3.1/strict/responses'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/schema'

/** Escape pipe characters so they don't break Markdown table rows */
const escapeTableCell = (value: string): string => value.replace(/\|/g, '\\|').replace(/\n/g, ' ')

/** Render a schema object as a compact inline type string for Markdown tables */
function schemaToType(schema: SchemaObject | undefined): string {
  if (!schema) return ''
  if (schema.type === 'array') {
    const items = getResolvedRef(schema.items as SchemaObject | undefined)
    return items?.type ? `${items.type}[]` : 'array'
  }
  if (schema.enum) {
    return schema.enum.map((v) => JSON.stringify(v)).join(' | ')
  }
  return String(schema.type ?? '')
}

/** Render a schema's properties as a Markdown table (one level deep) */
function schemaPropertiesToMarkdown(schema: SchemaObject | undefined): string {
  if (!schema?.properties) return ''

  const required = new Set<string>(Array.isArray(schema.required) ? (schema.required as string[]) : [])

  const rows = Object.entries(schema.properties as Record<string, SchemaObject>)
    .map(([name, propRef]) => {
      const prop = getResolvedRef(propRef)
      const type = schemaToType(prop)
      const req = required.has(name) ? 'Yes' : 'No'
      const desc = prop?.description ? escapeTableCell(prop.description) : ''
      return `| \`${name}\` | ${type} | ${req} | ${desc} |`
    })
    .join('\n')

  return `| Name | Type | Required | Description |\n|------|------|----------|-------------|\n${rows}`
}

/** Serialize a single operation to a Markdown string suitable for LLM consumption */
export function operationToMarkdown({
  method,
  path,
  operation,
}: {
  method: string
  path: string
  operation: OperationObject
}): string {
  const lines: string[] = []

  // Heading
  lines.push(`## ${method.toUpperCase()} ${path}`)
  lines.push('')

  if (operation.summary) {
    lines.push(`**${operation.summary}**`)
    lines.push('')
  }

  if (operation.description) {
    lines.push(operation.description.trim())
    lines.push('')
  }

  if (operation.deprecated) {
    lines.push('> ⚠️ This operation is deprecated.')
    lines.push('')
  }

  // Parameters
  const rawParams = operation.parameters ?? []
  const params = rawParams.map((p) => getResolvedRef(p as ParameterObject)).filter(Boolean) as ParameterObject[]
  if (params.length > 0) {
    lines.push('### Parameters')
    lines.push('')
    lines.push('| Name | In | Type | Required | Description |')
    lines.push('|------|----|------|----------|-------------|')
    for (const param of params) {
      const schema = 'schema' in param ? getResolvedRef(param.schema as SchemaObject | undefined) : undefined
      const type = schemaToType(schema)
      const req = param.required ? 'Yes' : 'No'
      const desc = param.description ? escapeTableCell(param.description) : ''
      lines.push(`| \`${param.name}\` | ${param.in} | ${type} | ${req} | ${desc} |`)
    }
    lines.push('')
  }

  // Request body
  const requestBody = getResolvedRef(operation.requestBody as RequestBodyObject | undefined)
  if (requestBody?.content) {
    lines.push('### Request Body')
    lines.push('')
    if (requestBody.description) {
      lines.push(requestBody.description.trim())
      lines.push('')
    }
    for (const [contentType, mediaType] of Object.entries(requestBody.content)) {
      lines.push(`**Content-Type:** \`${contentType}\``)
      lines.push('')
      const schema = getResolvedRef(mediaType.schema as SchemaObject | undefined)
      const propTable = schemaPropertiesToMarkdown(schema)
      if (propTable) {
        lines.push(propTable)
        lines.push('')
      } else if (schema?.type) {
        lines.push(`Type: \`${schemaToType(schema)}\``)
        lines.push('')
      }
    }
  }

  // Responses
  const responses = operation.responses as ResponsesObject | undefined
  if (responses) {
    lines.push('### Responses')
    lines.push('')
    for (const [statusCode, responseRef] of Object.entries(responses)) {
      const response = getResolvedRef(responseRef as ResponseObject | undefined)
      if (!response || typeof response !== 'object') continue
      const desc = ('description' in response ? response.description : '') ?? ''
      lines.push(`- \`${statusCode}\` — ${desc}`)
    }
    lines.push('')
  }

  return lines.join('\n').trimEnd()
}
