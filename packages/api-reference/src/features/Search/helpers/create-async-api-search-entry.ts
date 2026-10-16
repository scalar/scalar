import { isObject } from '@scalar/helpers/object/is-object'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'

import { pickHeading } from '@/components/Content/AsyncApi/helpers/pick-heading'
import {
  resolveAsyncApiChannel,
  resolveAsyncApiMessage,
  resolveAsyncApiOperation,
} from '@/components/Content/AsyncApi/helpers/resolve-async-api-nodes'
import type { FuseData } from '@/features/Search/types'

/** Collect schema fields without treating examples, defaults, or other literal data as schemas. */
const extractSchemaFields = (roots: unknown[]): { names: string[]; descriptions: string[] } => {
  const names = new Set<string>()
  const descriptions = new Set<string>()
  const visited = new Set<object>()
  const pending = [...roots].reverse()
  while (pending.length) {
    const value = pending.pop()
    if (!isObject(value) || visited.has(value)) {
      continue
    }
    visited.add(value)
    if ('$ref' in value) {
      pending.push(getResolvedRef(value))
    }
    if ('schemaFormat' in value) {
      const format = String(value.schemaFormat).split(';')[0]?.trim().toLowerCase()
      if (
        [
          'application/schema+json',
          'application/schema+yaml',
          'application/vnd.aai.asyncapi',
          'application/vnd.aai.asyncapi+json',
          'application/vnd.aai.asyncapi+yaml',
        ].includes(format ?? '')
      ) {
        pending.push(value.schema)
      }
      continue
    }
    if (typeof value.description === 'string') {
      descriptions.add(value.description)
    }
    if (isObject(value.properties)) {
      for (const [name, property] of Object.entries(value.properties)) {
        names.add(name)
        pending.push(property)
      }
    }
    for (const keyword of ['allOf', 'oneOf', 'anyOf', 'prefixItems', 'items']) {
      const child = value[keyword]
      pending.push(...(Array.isArray(child) ? child : [child]))
    }
    if (isObject(value.patternProperties)) {
      pending.push(...Object.values(value.patternProperties))
    }
    pending.push(value.additionalProperties)
  }
  return { names: [...names], descriptions: [...descriptions] }
}

/** Build an AsyncAPI result using the same resolved objects as the content renderer. */
export const createAsyncApiSearchEntry = (document: AsyncApiDocument, entry: TraversedEntry): FuseData | undefined => {
  if (entry.type === 'asyncapi-channel') {
    const channel = resolveAsyncApiChannel(document, entry.channelName)
    return {
      type: entry.type,
      id: entry.id,
      title: entry.title,
      entry,
      identifiers: [entry.channelName],
      path: channel?.address ?? undefined,
      description: [channel?.summary, channel?.description].filter(Boolean).join('\n'),
      parameters: Object.keys(channel?.parameters ?? {}),
      parameterDescriptions: Object.values(channel?.parameters ?? {}).flatMap((parameter) => {
        const description = getResolvedRef(parameter)?.description
        return description ? [description] : []
      }),
    }
  }
  if (entry.type === 'asyncapi-operation') {
    const operation = resolveAsyncApiOperation(document, entry.operationName)
    return {
      type: entry.type,
      id: entry.id,
      title: pickHeading(operation?.title, entry.title, entry.operationName),
      entry,
      identifiers: [entry.operationName],
      action: entry.action,
      path: resolveAsyncApiChannel(document, entry.channelName)?.address ?? undefined,
      description: [operation?.summary, operation?.description].filter(Boolean).join('\n'),
    }
  }
  if (entry.type === 'asyncapi-message') {
    const message = resolveAsyncApiMessage(document, entry.channelName, entry.messageName)
    const fields = extractSchemaFields([message?.payload, message?.headers])
    return {
      type: entry.type,
      id: entry.id,
      title: pickHeading(message?.title, entry.title, entry.messageName),
      entry,
      identifiers: message?.name ? [entry.messageName, message.name] : [entry.messageName],
      path: resolveAsyncApiChannel(document, entry.channelName)?.address ?? undefined,
      description: message?.description ?? message?.summary ?? '',
      body: fields.names,
      bodyDescriptions: [...new Set([...(message?.summary ? [message.summary] : []), ...fields.descriptions])],
    }
  }
  return undefined
}
