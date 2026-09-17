import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import type { ListItem, RootContent } from 'mdast'

import { heading, item, list, paragraph, strong, text } from './markdown-nodes'
import type { DescriptionParser } from './parse-description'

/** Preserve OR between requirements and AND between schemes within a requirement. */
export const renderSecurity = async (
  requirements: OpenApiDocument['security'],
  schemes: NonNullable<OpenApiDocument['components']>['securitySchemes'],
  description: DescriptionParser,
): Promise<RootContent[]> => {
  if (!requirements) return []
  const nodes: RootContent[] = [heading(4, text('Authentication'))]
  if (!requirements.length) nodes.push(paragraph(text('No authentication required.')))
  for (const [index, requirement] of requirements.entries()) {
    if (index) nodes.push(paragraph(text('Or:')))
    const entries = Object.entries(requirement)
    if (!entries.length) {
      nodes.push(paragraph(text('No authentication required.')))
      continue
    }
    const entriesNodes: ListItem[] = []
    for (const [name, scopes] of entries) {
      const blocks: ListItem['children'] = [
        paragraph(strong(text(name)), ...(scopes?.length ? [text(` Scopes: ${scopes.join(', ')}`)] : [])),
      ]
      const scheme = getResolvedRef(schemes?.[name])
      if (scheme) {
        blocks.push({ type: 'code', value: JSON.stringify(scheme, null, 2) })
        blocks.push(...((await description(scheme.description)) as ListItem['children']))
      }
      entriesNodes.push(item(...blocks))
    }
    nodes.push(list(entriesNodes))
  }
  return nodes
}
