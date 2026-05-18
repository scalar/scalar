import type { InfoObject, OperationObject, SchemaObject, TagObject } from '@scalar/types/openapi/3.1'
import {
  type Static,
  array,
  boolean,
  coerce,
  intersection,
  lazy,
  literal,
  object,
  optional,
  record,
  string,
  unknown,
} from '@scalar/validation'

import { TraversedEntrySchemaDefinition } from './navigation-entry'
import { httpMethodSchema } from './navigation-http-method'
import { assert } from 'vitest'

export const NavigationBaseSchemaDefinition = object({
  id: string({
    typeComment: 'The unique identifier for the entry. Must be unique across the entire navigation structure.',
  }),
  title: string({ typeComment: 'The user readable title of the entry' }),
})

export type NavigationBase = Static<typeof NavigationBaseSchemaDefinition>

export const TraversedDocumentSchemaDefinition = intersection([
  NavigationBaseSchemaDefinition,
  object({
    type: literal('document'),
    name: string(),
    children: optional(array(lazy(() => TraversedEntrySchemaDefinition))),
    icon: optional(string()),
  }),
])

/** An entry representing an OpenAPI document in the navigation structure. */
export type TraversedDocument = Static<typeof TraversedDocumentSchemaDefinition>

export const TraversedDescriptionSchemaDefinition = intersection([
  NavigationBaseSchemaDefinition,
  object({
    type: literal('text'),
    children: optional(array(lazy(() => TraversedEntrySchemaDefinition))),
  }),
])

/** An entry representing a markdown description in the navigation structure. */
export type TraversedDescription = Static<typeof TraversedDescriptionSchemaDefinition>

export const TraversedExampleSchemaDefinition = intersection([
  NavigationBaseSchemaDefinition,
  object({
    type: literal('example'),
    name: string(),
  }),
])

/** An entry representing an operation example in the navigation structure. */
export type TraversedExample = Static<typeof TraversedExampleSchemaDefinition>

export const TraversedOperationSchemaDefinition = intersection([
  NavigationBaseSchemaDefinition,
  object({
    type: literal('operation'),
    ref: string(),
    method: httpMethodSchema,
    path: string(),
    isDeprecated: optional(boolean()),
    children: optional(array(lazy(() => TraversedEntrySchemaDefinition))),
  }),
])

/** An entry representing an operation in the navigation structure. */
export type TraversedOperation = Static<typeof TraversedOperationSchemaDefinition>

export const TraversedSchemaSchemaDefinition = intersection([
  NavigationBaseSchemaDefinition,
  object({
    type: literal('model'),
    ref: string(),
    name: string(),
  }),
])

/** An entry representing a model in the navigation structure. */
export type TraversedSchema = Static<typeof TraversedSchemaSchemaDefinition>

export const TraversedWebhookSchemaDefinition = intersection([
  NavigationBaseSchemaDefinition,
  object({
    type: literal('webhook'),
    ref: string(),
    method: httpMethodSchema,
    name: string(),
    isDeprecated: optional(boolean()),
  }),
])

/** An entry representing a webhook in the navigation structure. */
export type TraversedWebhook = Static<typeof TraversedWebhookSchemaDefinition>

export const TraversedTagSchemaDefinition = intersection([
  NavigationBaseSchemaDefinition,
  object({
    type: literal('tag'),
    name: string(),
    description: optional(string()),
    children: optional(array(lazy(() => TraversedEntrySchemaDefinition))),
    isGroup: boolean(),
    isWebhooks: optional(boolean()),
    xKeys: optional(record(string(), unknown())),
  }),
])

/**
 * An entry representing a tag in the navigation structure.
 *
 * Used to group operations or webhooks under a common heading.
 */
export type TraversedTag = Static<typeof TraversedTagSchemaDefinition>

export const TraversedModelsSchemaDefinition = intersection([
  NavigationBaseSchemaDefinition,
  object({
    type: literal('models'),
    name: string(),
    children: optional(array(lazy(() => TraversedEntrySchemaDefinition))),
  }),
])

/** Top level models navigation entry. */
export type TraversedModels = Static<typeof TraversedModelsSchemaDefinition>

export type TraversedEntry = Static<typeof TraversedEntrySchemaDefinition>

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
  info: InfoObject
  type: 'document'
}

type DescriptionIdProps = {
  info: InfoObject
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

export type IdGeneratorProps =
  | DocumentIdProps
  | DescriptionIdProps
  | TagProps
  | OperationProps
  | WebhookProps
  | ModelProps
  | ExampleProps

export type IdGenerator = (props: IdGeneratorProps) => string