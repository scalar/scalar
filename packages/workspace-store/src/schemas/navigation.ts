import { type Static, Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'

export const NavigationBaseSchema = Type.Object({
  type: Type.Union([
    Type.Literal('text'),
    Type.Literal('operation'),
    Type.Literal('model'),
    Type.Literal('tag'),
    Type.Literal('webhook'),
  ]),
  id: Type.String(),
  title: Type.String(),
})

export const TraversedDescriptionSchema = compose(
  NavigationBaseSchema,
  Type.Object({
    type: Type.Literal('text'),
    children: Type.Optional(Type.Array(NavigationBaseSchema)),
  }),
)

export type TraversedDescription = Static<typeof TraversedDescriptionSchema>

export const TraversedOperationSchema = compose(
  NavigationBaseSchema,
  Type.Object({
    type: Type.Literal('operation'),
    ref: Type.String(),
    method: Type.String(),
    path: Type.String(),
  }),
)

export type TraversedOperation = Static<typeof TraversedOperationSchema>

export const TraversedSchemaSchema = compose(
  NavigationBaseSchema,
  Type.Object({
    type: Type.Literal('model'),
    ref: Type.String(),
    name: Type.String(),
  }),
)

export type TraversedSchema = Static<typeof TraversedSchemaSchema>

export const TraversedWebhookSchema = compose(
  NavigationBaseSchema,
  Type.Object({
    type: Type.Literal('webhook'),
    ref: Type.String(),
    method: Type.String(),
    name: Type.String(),
  }),
)

export type TraversedWebhook = Static<typeof TraversedWebhookSchema>

const TraversedEntryRef = Type.Ref('TraversedEntrySchema')
const TraversedTagRef = Type.Ref('TraversedTagSchema')

const TraversedTagSchemaDefinition = compose(
  NavigationBaseSchema,
  Type.Object({
    type: Type.Literal('tag'),
    name: Type.String(),
    children: Type.Optional(Type.Array(TraversedEntryRef)),
    isGroup: Type.Boolean(),
  }),
)

const TraversedEntrySchemaDefinition = Type.Union([
  TraversedTagRef,
  TraversedDescriptionSchema,
  TraversedOperationSchema,
  TraversedSchemaSchema,
  TraversedWebhookSchema,
])

const module = Type.Module({
  TraversedTagSchema: TraversedTagSchemaDefinition,
  TraversedEntrySchema: TraversedEntrySchemaDefinition,
})

export const TraversedTagSchema = module.Import('TraversedTagSchema')
export const TraversedEntrySchema = module.Import('TraversedEntrySchema')

export type TraversedTag = Static<typeof TraversedTagSchema>
export type TraversedEntry = Static<typeof TraversedEntrySchema>
