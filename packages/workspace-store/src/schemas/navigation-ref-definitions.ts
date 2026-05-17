import { HTTP_METHODS, type HttpMethod } from '@scalar/helpers/http/http-methods'
import { type TLiteral, Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'

import { NavigationBaseSchemaDefinition } from './navigation-base'

/**
 * Recursive navigation entry schema used for `children` arrays.
 *
 * Defined separately so leaf entry schemas can reference it without circular imports.
 */
export const TraversedEntrySchemaDefinition = Type.Recursive((Entry) =>
  Type.Union([
    compose(
      NavigationBaseSchemaDefinition,
      Type.Object({
        type: Type.Literal('document'),
        name: Type.String(),
        children: Type.Optional(Type.Array(Entry)),
        icon: Type.Optional(Type.String()),
      }),
    ),
    compose(
      NavigationBaseSchemaDefinition,
      Type.Object({
        type: Type.Literal('text'),
        children: Type.Optional(Type.Array(Entry)),
      }),
    ),
    compose(
      NavigationBaseSchemaDefinition,
      Type.Object({
        type: Type.Literal('example'),
        name: Type.String(),
      }),
    ),
    compose(
      NavigationBaseSchemaDefinition,
      Type.Object({
        type: Type.Literal('operation'),
        ref: Type.String(),
        method: Type.Union(HTTP_METHODS.map((method) => Type.Literal(method))) as unknown as TLiteral<HttpMethod>,
        path: Type.String(),
        isDeprecated: Type.Optional(Type.Boolean()),
        children: Type.Optional(Type.Array(Entry)),
      }),
    ),
    compose(
      NavigationBaseSchemaDefinition,
      Type.Object({
        type: Type.Literal('model'),
        ref: Type.String(),
        name: Type.String(),
      }),
    ),
    compose(
      NavigationBaseSchemaDefinition,
      Type.Object({
        type: Type.Literal('webhook'),
        ref: Type.String(),
        method: Type.Union(HTTP_METHODS.map((method) => Type.Literal(method))) as unknown as TLiteral<HttpMethod>,
        name: Type.String(),
        isDeprecated: Type.Optional(Type.Boolean()),
      }),
    ),
    compose(
      NavigationBaseSchemaDefinition,
      Type.Object({
        type: Type.Literal('tag'),
        name: Type.String(),
        description: Type.Optional(Type.String()),
        children: Type.Optional(Type.Array(Entry)),
        isGroup: Type.Boolean(),
        isWebhooks: Type.Optional(Type.Boolean()),
        xKeys: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
      }),
    ),
    compose(
      NavigationBaseSchemaDefinition,
      Type.Object({
        type: Type.Literal('models'),
        name: Type.String(),
        children: Type.Optional(Type.Array(Entry)),
      }),
    ),
  ]),
)

export const TraversedEntryObjectRef = TraversedEntrySchemaDefinition
