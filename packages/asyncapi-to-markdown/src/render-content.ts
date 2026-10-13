import { isXmlMediaType } from '@scalar/helpers/http/is-xml-media-type'
import { getRaw } from '@scalar/json-magic/magic-proxy'
import {
  anchor,
  createDocumentAnchors,
  describe,
  heading,
  inlineCode,
  item,
  link,
  list,
  paragraph,
  strong,
  text,
} from '@scalar/openapi-to-markdown/markdown'
import { resolveTraits } from '@scalar/workspace-store/helpers/resolve-traits'
import { getXmlBodyExample } from '@scalar/workspace-store/request-example'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import type { Heading, RootContent } from 'mdast'

import { getBindingSchemas } from './binding-schemas'
import { object, string } from './document'
import { createExampleRenderer } from './render-examples'
import { code, createSchemaRenderer } from './render-schema'
import type { createSchemaRegistry } from './schema-references'

const deeper = (depth: Heading['depth']): Heading['depth'] => Math.min(depth + 1, 6) as Heading['depth']
const title = (value: Record<string, unknown>, fallback: string): string =>
  string(value.title) || string(value.summary) || string(value.name) || fallback
const entries = (value: unknown): [string, unknown][] => Object.entries(object(value))
const withTraits = (value: unknown): Record<string, unknown> => {
  const target = object(value)
  return resolveTraits(target, Array.isArray(target.traits) ? target.traits.map(object) : [])
}

/** Page-local rendering functions share output and schema expansion state. */
type ContentRenderer = {
  blocks: RootContent[]
  introduction: () => void
  finish: () => void
  channel: (name: string, value: unknown, depth: Heading['depth']) => void
  operation: (name: string, value: unknown, depth: Heading['depth'], includeChannel: boolean) => void
  message: (name: string, value: unknown, depth: Heading['depth']) => void
  model: (name: string, value: unknown, depth: Heading['depth']) => void
}

/** Build the sections of one AsyncAPI page without retaining mutable state between calls. */
export const createContentRenderer = (
  document: Record<string, unknown>,
  references: ReturnType<ReturnType<typeof createSchemaRegistry>['forPage']>,
  view: (input: Record<string, unknown>) => Record<string, unknown>,
  linked: boolean,
  selectedModel: boolean,
  selectedTag?: string,
  inlinePrimitives = true,
): ContentRenderer => {
  const examples = createExampleRenderer(inlinePrimitives)
  const renderSchema = createSchemaRenderer(references.reference, view, linked)
  const schema = (input: unknown, expand = false, mediaType = 'application/json'): RootContent[] =>
    expand
      ? renderSchema(input, true, mediaType)
      : references.root(input, () => renderSchema(input, false, mediaType), mediaType)
  const anchors = createDocumentAnchors()
  const shownMessages = new Map<unknown, string>()
  const shownServers = new Map<unknown, string>()
  const shownSecurity = new Map<unknown, string>()
  const blocks: RootContent[] = []
  const metadata = (value: Record<string, unknown>): void => {
    if (value.summary && value.summary !== value.title) {
      blocks.push(...describe(value.summary))
    }
    blocks.push(...describe(value.description))
    const tags = Array.isArray(value.tags) ? value.tags.map((tag) => string(object(tag).name)).filter(Boolean) : []
    const visibleTags = selectedTag ? tags.filter((tag) => tag === selectedTag) : tags
    if (visibleTags.length) {
      blocks.push(paragraph(strong(text('Tags:')), text(' '), text(visibleTags.join(', '))))
    }
    const external = object(value.externalDocs)
    if (typeof external.url === 'string') {
      blocks.push(paragraph(link(external.url, string(external.description) || 'External documentation')))
    }
  }
  const fields = (value: Record<string, unknown>, names: readonly string[]): void => {
    const items = names.flatMap((name) =>
      value[name] === undefined
        ? []
        : [
            item(
              paragraph(
                strong(text(`${name}:`)),
                text(' '),
                inlineCode(typeof value[name] === 'string' ? value[name] : JSON.stringify(getRaw(value[name]))),
              ),
            ),
          ],
    )
    if (items.length) {
      blocks.push(list(items))
    }
  }
  const bindings = (value: unknown, depth: Heading['depth']): void => {
    const protocols = entries(value)
    if (!protocols.length) {
      return
    }
    blocks.push(heading(depth, text('Bindings')))
    for (const [protocol, binding] of protocols) {
      const resolved = object(binding)
      blocks.push(paragraph(strong(text(protocol))), code(resolved))
      for (const reference of getBindingSchemas(resolved)) {
        blocks.push(
          paragraph(strong(text('Referenced schema:')), text(' '), inlineCode(reference.$ref)),
          ...schema(reference),
        )
      }
    }
  }
  const security = (value: unknown, depth: Heading['depth']): void => {
    if (!Array.isArray(value) || !value.length) {
      return
    }
    blocks.push(heading(depth, text('Authentication')), paragraph(text('Supported security schemes:')))
    for (const entry of value) {
      const scheme = object(entry)
      const identity = getRaw(scheme)
      const previous = shownSecurity.get(identity)
      const label = string(scheme.name) || string(scheme.type) || 'Security scheme'
      if (previous) {
        blocks.push(paragraph(link(`#${previous}`, label)))
        continue
      }
      const id = anchors.get('security', String(shownSecurity.size), label)
      shownSecurity.set(identity, id)
      blocks.push(anchor(id))
      fields(scheme, ['type', 'name', 'in', 'scheme', 'bearerFormat', 'openIdConnectUrl', 'scopes'])
      blocks.push(...describe(scheme.description))
      if (scheme.flows) {
        blocks.push(code(scheme.flows))
      }
    }
  }
  const servers = (value: [string, unknown][], depth: Heading['depth']): void => {
    if (!value.length) {
      return
    }
    blocks.push(heading(depth, text('Servers')))
    for (const [name, entry] of value) {
      const server = object(entry)
      const identity = getRaw(server)
      const previous = shownServers.get(identity)
      if (previous) {
        blocks.push(paragraph(link(`#${previous}`, title(server, name))))
        continue
      }
      const serverId = anchors.get('server', String(shownServers.size), name)
      shownServers.set(identity, serverId)
      blocks.push(anchor(serverId))
      blocks.push(heading(deeper(depth), text(title(server, name))))
      fields(server, ['host', 'pathname', 'protocol', 'protocolVersion'])
      metadata(server)
      for (const [variableName, variable] of entries(server.variables)) {
        blocks.push(paragraph(strong(text('Server variable:')), text(' '), inlineCode(variableName)))
        fields(object(variable), ['default', 'enum', 'examples'])
        blocks.push(...describe(object(variable).description))
      }
      security(server.security, deeper(deeper(depth)))
      bindings(server.bindings, deeper(deeper(depth)))
    }
  }
  const channelServers = (channel: Record<string, unknown>): [string, unknown][] =>
    Array.isArray(channel.servers) && channel.servers.length > 0
      ? channel.servers.map((server, index) => [string(object(server).title) || `Server ${index + 1}`, server])
      : entries(document.servers)
  const message = (name: string, value: unknown, depth: Heading['depth']): void => {
    const identity = getRaw(object(value))
    if (selectedTag) {
      const previous = shownMessages.get(identity)
      if (previous) {
        blocks.push(paragraph(link(`#${previous}`, title(withTraits(value), name))))
        return
      }
      const id = anchors.get('message', String(shownMessages.size + 1), name)
      shownMessages.set(identity, id)
      blocks.push(anchor(id))
    }
    const msg = withTraits(value)
    const contentType = string(msg.contentType ?? document.defaultContentType) ?? 'application/json'
    blocks.push(heading(depth, text(title(msg, name))))
    metadata(msg)
    fields({ ...msg, contentType: msg.contentType ?? document.defaultContentType }, ['name', 'contentType'])
    if (msg.correlationId) {
      blocks.push(heading(deeper(depth), text('Correlation ID')))
      fields(object(msg.correlationId), ['location'])
      metadata(object(msg.correlationId))
    }
    for (const key of ['headers', 'payload'] as const) {
      if (msg[key] !== undefined) {
        blocks.push(
          heading(deeper(depth), text(key === 'headers' ? 'Headers' : 'Payload')),
          ...schema(
            key === 'payload' && typeof msg.schemaFormat === 'string'
              ? { schemaFormat: msg.schemaFormat, schema: msg[key] }
              : msg[key],
            false,
            key === 'payload' ? contentType : 'application/json',
          ),
        )
      }
    }
    if (Array.isArray(msg.examples)) {
      for (const example of msg.examples) {
        const authored = object(example)
        blocks.push(heading(deeper(depth), text(string(authored.name) || 'Example')))
        blocks.push(...describe(authored.summary))
        // Message examples contain authored headers and payload, not generated values.
        for (const key of ['headers', 'payload'] as const) {
          if (authored[key] !== undefined) {
            const xml = key === 'payload' && isXmlMediaType(contentType)
            const result =
              xml && typeof authored[key] !== 'string'
                ? getXmlBodyExample(object(msg.payload) as SchemaObject, { value: authored[key] })
                : undefined
            blocks.push(paragraph(strong(text(`${key}:`))))
            blocks.push(
              xml
                ? typeof authored[key] === 'string' || result?.xml !== undefined
                  ? code(result?.xml ?? authored[key], 'xml')
                  : paragraph(text('Unable to generate an XML example.'))
                : code(authored[key]),
            )
          }
        }
      }
    }
    if (!Array.isArray(msg.examples) || !msg.examples.length) {
      for (const key of ['headers', 'payload'] as const) {
        if (msg[key] !== undefined) {
          blocks.push(
            ...examples(
              key === 'payload' && typeof msg.schemaFormat === 'string'
                ? { schemaFormat: msg.schemaFormat, schema: msg[key] }
                : msg[key],
              linked,
              false,
              key === 'payload' ? contentType : 'application/json',
              key,
            ),
          )
        }
      }
    }
    bindings(msg.bindings, deeper(depth))
  }
  const channelContext = (channel: Record<string, unknown>, depth: Heading['depth']): void => {
    fields(channel, ['address'])
    metadata(channel)
    for (const [name, parameter] of entries(channel.parameters)) {
      blocks.push(heading(depth, text(`Parameter: ${name}`)))
      fields(object(parameter), ['enum', 'default', 'examples', 'location'])
      metadata(object(parameter))
    }
    servers(channelServers(channel), depth)
    bindings(channel.bindings, depth)
  }
  const messages = (owner: Record<string, unknown>, channel: Record<string, unknown>): [string, unknown][] =>
    Array.isArray(owner.messages)
      ? owner.messages.map((msg, index) => [title(object(msg), `Message ${index + 1}`), msg])
      : entries(channel.messages)
  const operation = (name: string, value: unknown, depth: Heading['depth'], includeChannel: boolean): void => {
    const op = withTraits(value)
    const channel = object(op.channel)
    blocks.push(heading(depth, text(title(op, name))))
    fields(op, ['action'])
    metadata(op)
    if (includeChannel) {
      blocks.push(heading(deeper(depth), text('Channel')))
      channelContext(channel, deeper(deeper(depth)))
    }
    security(op.security, deeper(depth))
    bindings(op.bindings, deeper(depth))
    for (const [messageName, msg] of messages(op, channel)) {
      message(messageName, msg, deeper(depth))
    }
    if (op.reply) {
      const reply = object(op.reply)
      const replyChannel = reply.channel === undefined ? channel : object(reply.channel)
      blocks.push(heading(deeper(depth), text('Reply')))
      if (reply.channel !== undefined) {
        channelContext(replyChannel, deeper(deeper(depth)))
      }
      const address = object(reply.address)
      fields(address, ['location'])
      metadata(address)
      for (const [messageName, msg] of messages(reply, replyChannel)) {
        message(messageName, msg, deeper(deeper(depth)))
      }
    }
  }
  const channel = (name: string, value: unknown, depth: Heading['depth']): void => {
    const current = object(value)
    blocks.push(heading(depth, text(title(current, name))))
    channelContext(current, deeper(depth))
    const operations = entries(document.operations).filter(
      ([, op]) => getRaw(object(withTraits(op).channel)) === getRaw(current),
    )
    for (const [operationName, op] of operations) {
      operation(operationName, op, deeper(depth), false)
    }
    // Include channel messages even when no operation uses them.
    const shown = new Set(
      operations.flatMap(([, op]) => messages(withTraits(op), current).map(([, msg]) => getRaw(object(msg)))),
    )
    for (const [messageName, msg] of entries(current.messages)) {
      if (!shown.has(getRaw(object(msg)))) {
        message(messageName, msg, deeper(depth))
      }
    }
  }
  const introduction = (): void => {
    const info = object(document.info)
    blocks.push(heading(1, text(title(info, 'AsyncAPI'))))
    fields({ version: info.version, asyncapi: document['x-original-aas-version'] ?? document.asyncapi }, [
      'version',
      'asyncapi',
    ])
    metadata(info)
    fields(info, ['termsOfService'])
    for (const name of ['contact', 'license'] as const) {
      if (info[name]) {
        blocks.push(heading(2, text(name === 'contact' ? 'Contact' : 'License')))
        fields(object(info[name]), ['name', 'email', 'url'])
      }
    }
    servers(entries(document.servers), 2)
  }
  const model = (name: string, value: unknown, depth: Heading['depth']): void => {
    blocks.push(
      ...references.model(value, () => [
        heading(depth, text(title(object(value), name))),
        ...schema(value, true),
        ...(view(object(value)).type === 'object' || view(object(value)).properties !== undefined
          ? examples(value, linked && !selectedModel, linked && selectedModel)
          : []),
      ]),
    )
  }
  return {
    blocks,
    introduction,
    channel,
    operation,
    message,
    model,
    finish: () => {
      blocks.push(...references.appendix((value) => schema(value, true)))
    },
  }
}
