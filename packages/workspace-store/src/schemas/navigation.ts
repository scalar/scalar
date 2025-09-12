import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'
import { TagObjectRef, TraversedEntryObjectRef, TraversedTagObjectRef } from '@/schemas/v3.1/strict/ref-definitions'

export const NavigationBaseSchemaDefinition = Type.Object({
  id: Type.String(),
  title: Type.String(),
})

export const TraversedDescriptionSchemaDefinition = compose(
  NavigationBaseSchemaDefinition,
  Type.Object({
    type: Type.Literal('text'),
    children: Type.Optional(Type.Array(NavigationBaseSchemaDefinition)),
  }),
)

export const TraversedOperationSchemaDefinition = compose(
  NavigationBaseSchemaDefinition,
  Type.Object({
    type: Type.Literal('operation'),
    ref: Type.String(),
    method: Type.String(),
    path: Type.String(),
    isDeprecated: Type.Optional(Type.Boolean()),
  }),
)

export const TraversedSchemaSchemaDefinition = compose(
  NavigationBaseSchemaDefinition,
  Type.Object({
    type: Type.Literal('model'),
    ref: Type.String(),
    name: Type.String(),
  }),
)

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

export const TraversedTagSchemaDefinition = compose(
  NavigationBaseSchemaDefinition,
  Type.Object({
    type: Type.Literal('tag'),
    name: Type.String(),
    tag: TagObjectRef,
    children: Type.Optional(Type.Array(TraversedEntryObjectRef)),
    isGroup: Type.Boolean(),
    isWebhooks: Type.Optional(Type.Boolean()),
  }),
)

export const TraversedEntrySchemaDefinition = Type.Union([
  TraversedTagObjectRef,
  TraversedDescriptionSchemaDefinition,
  TraversedOperationSchemaDefinition,
  TraversedSchemaSchemaDefinition,
  TraversedWebhookSchemaDefinition,
])
