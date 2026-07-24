import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { Type } from '@scalar/typebox'
import type { AsyncApiInfoObject } from '@scalar/types/asyncapi/3.1'

import { compose } from '@/schemas/compose'
import type { InfoObject } from '@/schemas/v3.1/strict/info'
import type { OperationObject } from '@/schemas/v3.1/strict/operation'
import { TraversedEntryObjectRef } from '@/schemas/v3.1/strict/ref-definitions'
import type { SchemaObject } from '@/schemas/v3.1/strict/schema'
import type { TagObject } from '@/schemas/v3.1/strict/tag'

export const NavigationBaseSchemaDefinition = Type.Object({
  id: Type.String(),
  title: Type.String(),
})

type BaseSchema = {
  /**
   * The unique identifier for the entry
   *
   * Must be unique across the entire navigation structure.
   */
  id: string
  /** The user readable title of the entry */
  title: string
}

export const TraversedDocumentSchemaDefinition = compose(
  NavigationBaseSchemaDefinition,
  Type.Object({
    type: Type.Literal('document'),
    name: Type.String(),
    children: Type.Optional(Type.Array(TraversedEntryObjectRef)),
    icon: Type.Optional(Type.String()),
  }),
)

/**
 * An entry representing an OpenAPI in the navigation structure.
 *
 * Used in the client to represent the root document and its operations or tags.
 */
export type TraversedDocument = BaseSchema & {
  type: 'document'
  /** Document name */
  name: string
  /** Child entries under the document */
  children?: TraversedEntry[]
  icon?: string
}

export const TraversedDescriptionSchemaDefinition = compose(
  NavigationBaseSchemaDefinition,
  Type.Object({
    type: Type.Literal('text'),
    children: Type.Optional(Type.Array(TraversedEntryObjectRef)),
  }),
)

/**
 * An entry representing a markdown description in the navigation structure.
 */
export type TraversedDescription = BaseSchema & {
  type: 'text'
  children?: TraversedEntry[]
}

export const TraversedExampleSchemaDefinition = compose(
  NavigationBaseSchemaDefinition,
  Type.Object({
    type: Type.Literal('example'),
    name: Type.String(),
  }),
)

/**
 * An entry representing an operation example in the navigation structure.
 */
export type TraversedExample = BaseSchema & {
  type: 'example'
  name: string
}

export const TraversedOperationSchemaDefinition = compose(
  NavigationBaseSchemaDefinition,
  Type.Object({
    type: Type.Literal('operation'),
    ref: Type.String(),
    method: Type.String(),
    path: Type.String(),
    isDeprecated: Type.Optional(Type.Boolean()),
    children: Type.Optional(Type.Array(TraversedEntryObjectRef)),
  }),
)
/**
 * An entry representing an operation in the navigation structure.
 */
export type TraversedOperation = BaseSchema & {
  type: 'operation'
  ref: string
  method: HttpMethod
  path: string
  isDeprecated?: boolean
  children?: TraversedEntry[]
}

export const TraversedAsyncApiOperationSchemaDefinition = compose(
  NavigationBaseSchemaDefinition,
  Type.Object({
    type: Type.Literal('asyncapi-operation'),
    operationName: Type.String(),
    action: Type.Union([Type.Literal('send'), Type.Literal('receive')]),
    channelName: Type.String(),
    channelAddress: Type.String(),
    children: Type.Optional(Type.Array(TraversedEntryObjectRef)),
  }),
)

/**
 * An entry representing an AsyncAPI operation in the navigation structure.
 */
export type TraversedAsyncApiOperation = BaseSchema & {
  type: 'asyncapi-operation'
  /** Key in `document.operations` */
  operationName: string
  action: 'send' | 'receive'
  /** Resolved channel key in `document.channels` */
  channelName: string
  /** Channel address for display and routing */
  channelAddress: string
  /** Messages available on this operation */
  children?: TraversedEntry[]
}

export const TraversedAsyncApiChannelSchemaDefinition = compose(
  NavigationBaseSchemaDefinition,
  Type.Object({
    type: Type.Literal('asyncapi-channel'),
    channelName: Type.String(),
    channelAddress: Type.String(),
    children: Type.Optional(Type.Array(TraversedEntryObjectRef)),
  }),
)

/**
 * An entry representing an AsyncAPI channel in the navigation structure.
 */
export type TraversedAsyncApiChannel = BaseSchema & {
  type: 'asyncapi-channel'
  /** Key in `document.channels` */
  channelName: string
  /** Channel address for display and routing */
  channelAddress: string
  /** Operations on the channel */
  children?: TraversedEntry[]
}

export const TraversedAsyncApiMessageSchemaDefinition = compose(
  NavigationBaseSchemaDefinition,
  Type.Object({
    type: Type.Literal('asyncapi-message'),
    messageName: Type.String(),
    channelName: Type.String(),
  }),
)

/**
 * An entry representing an AsyncAPI message in the navigation structure.
 */
export type TraversedAsyncApiMessage = BaseSchema & {
  type: 'asyncapi-message'
  /** Key in `channel.messages` */
  messageName: string
  /** Parent channel key in `document.channels` */
  channelName: string
}

export const TraversedSchemaSchemaDefinition = compose(
  NavigationBaseSchemaDefinition,
  Type.Object({
    type: Type.Literal('model'),
    ref: Type.String(),
    name: Type.String(),
  }),
)

/**
 * An entry representing a model in the navigation structure.
 */
export type TraversedSchema = BaseSchema & {
  type: 'model'
  ref: string
  name: string
}

export const TraversedWebhookSchemaDefinition = compose(
  NavigationBaseSchemaDefinition,
  Type.Object({
    type: Type.Literal('webhook'),
    ref: Type.String(),
    method: Type.String(),
    name: Type.String(),
    isDeprecated: Type.Optional(Type.Boolean()),
  }),
)

/**
 * An entry representing a webhook in the navigation structure.
 */
export type TraversedWebhook = BaseSchema & {
  type: 'webhook'
  ref: string
  method: HttpMethod
  name: string
  isDeprecated?: boolean
}

export const TraversedTagSchemaDefinition = compose(
  NavigationBaseSchemaDefinition,
  Type.Object({
    type: Type.Literal('tag'),
    name: Type.String(),
    description: Type.Optional(Type.String()),
    children: Type.Optional(Type.Array(TraversedEntryObjectRef)),
    isGroup: Type.Boolean(),
    isWebhooks: Type.Optional(Type.Boolean()),
    xKeys: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  }),
)

/**
 * An entry representing a tag in the navigation structure.
 *
 * Used to group operations or webhooks under a common heading.
 */
export type TraversedTag = BaseSchema & {
  type: 'tag'
  name: string
  description?: string
  children?: TraversedEntry[]
  isGroup: boolean
  isWebhooks?: boolean
  xKeys?: Record<string, unknown>
}

export const TraversedModelsSchemaDefinition = compose(
  NavigationBaseSchemaDefinition,
  Type.Object({
    type: Type.Literal('models'),
    name: Type.String(),
    children: Type.Optional(Type.Array(TraversedEntryObjectRef)),
  }),
)
/**
 *  Top level models navigation entry.
 */
export type TraversedModels = BaseSchema & {
  type: 'models'
  name: string
  children?: TraversedEntry[]
}

export const TraversedEntrySchemaDefinition = Type.Union([
  TraversedDescriptionSchemaDefinition,
  TraversedOperationSchemaDefinition,
  TraversedAsyncApiOperationSchemaDefinition,
  TraversedAsyncApiChannelSchemaDefinition,
  TraversedAsyncApiMessageSchemaDefinition,
  TraversedSchemaSchemaDefinition,
  TraversedTagSchemaDefinition,
  TraversedWebhookSchemaDefinition,
  TraversedExampleSchemaDefinition,
  TraversedDocumentSchemaDefinition,
  TraversedModelsSchemaDefinition,
])

export type TraversedEntry =
  | TraversedDescription
  | TraversedOperation
  | TraversedAsyncApiOperation
  | TraversedAsyncApiChannel
  | TraversedAsyncApiMessage
  | TraversedSchema
  | TraversedTag
  | TraversedWebhook
  | TraversedExample
  | TraversedDocument
  | TraversedModels

/**
 * Type helper for when we are storing the parent entry in the entry itself.
 * The parent is recursively defined to also include its own parent, except for
 * TraversedDocument which can be a terminal parent without requiring its own parent.
 */
export type WithParent<Entry extends TraversedEntry> = Entry & {
  parent: WithParent<TraversedEntry> | TraversedDocument
}

export type DocumentIdProps = {
  name: string
  info: InfoObject | AsyncApiInfoObject
  type: 'document'
}

type DescriptionIdProps = {
  info: InfoObject | AsyncApiInfoObject
  type: 'text'
  slug?: string
  depth?: number
  value: string
  parentId: string
}

export type ParentTag = {
  tag: TagObject
  id: string
}

type TagProps = {
  parentId: string
  tag: TagObject
  type: 'tag'
  /**
   * Set when `tag` is a `tagGroup` entry so IDs stay distinct from same-named
   * OpenAPI tags and from other groups.
   */
  isGroup?: boolean
}

type OperationProps = {
  parentId: string
  operation: OperationObject
  path: string
  method: string
  type: 'operation'
  parentTag?: ParentTag
}

type WebhookProps = {
  parentId: string
  webhook?: OperationObject
  name: string
  method?: string
  type: 'webhook'
  parentTag?: ParentTag
}

type ModelProps = {
  parentId: string
  schema?: SchemaObject
  name?: string
  type: 'model'
  parentTag?: ParentTag
}

type ExampleProps = {
  parentId: string
  name: string
  type: 'example'
}

type AsyncApiOperationProps = {
  parentId: string
  operationName: string
  type: 'asyncapi-operation'
  parentTag?: ParentTag
}

type AsyncApiChannelProps = {
  parentId: string
  channelName: string
  type: 'asyncapi-channel'
  parentTag?: ParentTag
}

type AsyncApiMessageProps = {
  parentId: string
  messageName: string
  channelName: string
  type: 'asyncapi-message'
}

export type IdGeneratorProps =
  | DocumentIdProps
  | DescriptionIdProps
  | TagProps
  | OperationProps
  | AsyncApiOperationProps
  | AsyncApiChannelProps
  | AsyncApiMessageProps
  | WebhookProps
  | ModelProps
  | ExampleProps

export type IdGenerator = (props: IdGeneratorProps) => string
