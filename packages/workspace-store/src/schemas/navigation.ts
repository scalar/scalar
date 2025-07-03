import { compose } from '@/schemas/compose'
import { Type, type Static } from '@sinclair/typebox'

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

export const TraversedOperationSchema = compose(
  NavigationBaseSchema,
  Type.Object({
    type: Type.Literal('operation'),
    ref: Type.String(),
    method: Type.String(),
    path: Type.String(),
  }),
)

export const TraversedSchemaSchema = compose(
  NavigationBaseSchema,
  Type.Object({
    type: Type.Literal('model'),
    ref: Type.String(),
    name: Type.String(),
  }),
)

export const TraversedTagSchema = compose(
  NavigationBaseSchema,
  Type.Object({
    type: Type.Literal('tag'),
    name: Type.String(),
    children: Type.Optional(Type.Array(NavigationBaseSchema)),
    isGroup: Type.Boolean(),
  }),
)

export const TraversedWebhookSchema = compose(
  NavigationBaseSchema,
  Type.Object({
    type: Type.Literal('webhook'),
    ref: Type.String(),
    method: Type.String(),
    name: Type.String(),
  }),
)

export const TraversedEntrySchema = Type.Union([
  TraversedDescriptionSchema,
  TraversedOperationSchema,
  TraversedSchemaSchema,
  TraversedTagSchema,
  TraversedWebhookSchema,
])

export type TraversedEntry = Static<typeof TraversedEntrySchema>
