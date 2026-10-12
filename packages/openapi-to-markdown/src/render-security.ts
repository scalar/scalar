import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import type { Heading, ListItem, PhrasingContent, RootContent } from 'mdast'

import { heading, inlineCode, item, list, paragraph, strong, text } from './markdown-nodes'
import type { DescriptionParser } from './parse-description'

type SecurityScheme = NonNullable<
  ReturnType<typeof getResolvedRef<NonNullable<NonNullable<OpenApiDocument['components']>['securitySchemes']>[string]>>
>

const flowNames: Record<string, string> = {
  implicit: 'implicit',
  password: 'password',
  clientCredentials: 'client credentials',
  authorizationCode: 'authorization code',
  deviceAuthorization: 'device authorization',
}

/** Summarize a security scheme on one line, for example "API key in header `X-Api-Key`". */
const summarizeScheme = (scheme: SecurityScheme): PhrasingContent[] => {
  const value = scheme as Record<string, unknown>
  switch (value.type) {
    case 'apiKey':
      return [text(`API key in ${String(value.in ?? 'header')} `), inlineCode(value.name)]
    case 'http': {
      const name = typeof value.scheme === 'string' ? value.scheme.toLowerCase() : ''
      return [
        text(`HTTP ${name || 'authentication'}`),
        ...(typeof value.bearerFormat === 'string' ? [text(' ('), inlineCode(value.bearerFormat), text(')')] : []),
      ]
    }
    case 'oauth2': {
      const flows = Object.entries(typeof value.flows === 'object' && value.flows ? value.flows : {})
      const nodes: PhrasingContent[] = [text('OAuth 2.0')]
      for (const [index, [flow, settings]] of flows.entries()) {
        const urls = settings as Record<string, unknown>
        nodes.push(text(`${index ? '; ' : ': '}${flowNames[flow] ?? flow}`))
        for (const [key, label] of [
          ['authorizationUrl', 'authorize'],
          ['deviceAuthorizationUrl', 'device authorization'],
          ['tokenUrl', 'token'],
          ['refreshUrl', 'refresh'],
        ] as const) {
          // Coercion fills in optional URLs as empty strings.
          if (typeof urls[key] === 'string' && urls[key]) {
            nodes.push(text(`, ${label} `), inlineCode(urls[key]))
          }
        }
      }
      return nodes
    }
    case 'openIdConnect':
      return [text('OpenID Connect '), inlineCode(value.openIdConnectUrl)]
    case 'mutualTLS':
      return [text('Mutual TLS')]
    default:
      return [inlineCode(value.type)]
  }
}

/**
 * Preserve OR between requirements and AND between schemes within a requirement.
 * Without declared requirements there is nothing to say: only an explicit empty list means that
 * no authentication is required.
 */
export const renderSecurity = async (
  requirements: OpenApiDocument['security'],
  schemes: NonNullable<OpenApiDocument['components']>['securitySchemes'],
  description: DescriptionParser,
  level: Heading['depth'] = 4,
): Promise<RootContent[]> => {
  if (!requirements) {
    return []
  }
  const nodes: RootContent[] = [heading(level, text('Authentication'))]
  if (!requirements.length) {
    nodes.push(paragraph(text('No authentication required.')))
  }
  for (const [index, requirement] of requirements.entries()) {
    if (index) {
      nodes.push(paragraph(text('Or:')))
    }
    const entries = Object.entries(requirement)
    if (!entries.length) {
      nodes.push(paragraph(text('No authentication required.')))
      continue
    }
    const entriesNodes: ListItem[] = []
    for (const [name, scopes] of entries) {
      const scheme = getResolvedRef(schemes?.[name])
      const line: PhrasingContent[] = [strong(text(name))]
      if (scheme) {
        line.push(text(': '), ...summarizeScheme(scheme))
      }
      if (scopes?.length) {
        line.push(text(', scopes: '), inlineCode(scopes.join(', ')))
      }
      entriesNodes.push(item(paragraph(...line), ...((await description(scheme?.description)) as ListItem['children'])))
    }
    nodes.push(list(entriesNodes))
  }
  return nodes
}
