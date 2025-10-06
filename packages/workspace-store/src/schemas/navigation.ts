import { HTTP_METHODS, type HttpMethod } from '@scalar/helpers/http/http-methods'
import { type TLiteral, Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'
import { TraversedEntryObjectRef } from '@/schemas/v3.1/strict/ref-definitions'

export const NavigationBaseSchemaDefinition = Type.Object({
  id: Type.String(),
  title: Type.String(),
})

type BaseSchema = {
  id: string
  title: string
}

export const TraversedDescriptionSchemaDefinition = compose(
  NavigationBaseSchemaDefinition,
  Type.Object({
    type: Type.Literal('text'),
    children: Type.Optional(Type.Array(TraversedEntryObjectRef)),
  }),
)

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

export type TraversedExample = BaseSchema & {
  type: 'example'
  name: string
}

export const TraversedOperationSchemaDefinition = compose(
  NavigationBaseSchemaDefinition,
  Type.Object({
    type: Type.Literal('operation'),
    ref: Type.String(),
    method: Type.Union(HTTP_METHODS.map((method) => Type.Literal(method))) as unknown as TLiteral<HttpMethod>,
    path: Type.String(),
    isDeprecated: Type.Optional(Type.Boolean()),
    children: Type.Optional(Type.Array(TraversedEntryObjectRef)),
  }),
)

export type TraversedOperation = BaseSchema & {
  type: 'operation'
  ref: string
  method: HttpMethod
  path: string
  isDeprecated?: boolean
  children?: TraversedEntry[]
}

export const TraversedSchemaSchemaDefinition = compose(
  NavigationBaseSchemaDefinition,
  Type.Object({
    type: Type.Literal('model'),
    ref: Type.String(),
    name: Type.String(),
  }),
)

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
    method: Type.Union(HTTP_METHODS.map((method) => Type.Literal(method))) as unknown as TLiteral<HttpMethod>,
    name: Type.String(),
    isDeprecated: Type.Optional(Type.Boolean()),
  }),
)

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

export type TraversedTag = BaseSchema & {
  type: 'tag'
  name: string
  description?: string
  children?: TraversedEntry[]
  isGroup: boolean
  isWebhooks?: boolean
  xKeys?: Record<string, unknown>
}

export const TraversedEntrySchemaDefinition = Type.Union([
  TraversedDescriptionSchemaDefinition,
  TraversedOperationSchemaDefinition,
  TraversedSchemaSchemaDefinition,
  TraversedTagSchemaDefinition,
  TraversedWebhookSchemaDefinition,
  TraversedExampleSchemaDefinition,
])

export type TraversedEntry =
  | TraversedDescription
  | TraversedOperation
  | TraversedSchema
  | TraversedTag
  | TraversedWebhook
  | TraversedExample
