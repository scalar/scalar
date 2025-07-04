import { compose } from '@/schemas/compose'
import { Type, type Static, type TSchema } from '@sinclair/typebox'

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

// Recursive schemas for traversed tags and entries
const traversedTagSchemaBuilder = <T extends TSchema>(traversedEntrySchema: T) =>
  compose(
    NavigationBaseSchema,
    Type.Object({
      type: Type.Literal('tag'),
      name: Type.String(),
      children: Type.Optional(Type.Array(traversedEntrySchema)),
      isGroup: Type.Boolean(),
    }),
  )

const traversedEntrySchemaBuilder = <T extends TSchema>(traversedTagSchema: T) =>
  Type.Union([
    TraversedDescriptionSchema,
    TraversedOperationSchema,
    TraversedSchemaSchema,
    traversedTagSchema,
    TraversedWebhookSchema,
  ])

export const TraversedTagSchema = Type.Recursive((This) => traversedTagSchemaBuilder(traversedEntrySchemaBuilder(This)))

export const TraversedEntrySchema = Type.Recursive((This) =>
  traversedEntrySchemaBuilder(traversedTagSchemaBuilder(This)),
)

export type TraversedTag = Static<typeof TraversedTagSchema>
export type TraversedEntry = Static<typeof TraversedEntrySchema>
