import { Type, type Static } from '@sinclair/typebox'
import { AVAILABLE_CLIENTS } from '@scalar/types/snippetz'
import { defaultMeta, MetaSchema } from '@/schemas/reference-config/meta'
import { defaultFeatures, FeaturesSchema } from '@/schemas/reference-config/features'
import { AppearanceSchema, defaultAppearance } from '@/schemas/reference-config/appearance'
import { defaultRouting, RoutingSchema } from '@/schemas/reference-config/routing'
import { defaultSettings, SettingsSchema } from '@/schemas/reference-config/settings'
import type { MutableArray } from 'vitest'

export const ReferenceConfigSchema = Type.Partial(
  Type.Object({
    title: Type.String(),
    slug: Type.String(),
    settings: SettingsSchema,
    tagSort: Type.Union([Type.Literal('alpha')]),
    operationSort: Type.Union([Type.Literal('method'), Type.Literal('alpha')]),
    routing: RoutingSchema,
    appearance: AppearanceSchema,
    features: FeaturesSchema,
    meta: MetaSchema,
    httpClients: Type.Array(Type.Union(AVAILABLE_CLIENTS.map((client) => Type.Literal(client)))),
  }),
)

export type ReferenceConfig = Static<typeof ReferenceConfigSchema>

export const defaultReferenceConfig: Required<ReferenceConfig> = {
  title: 'Scalar API Reference',
  slug: 'scalar-api-reference',
  tagSort: 'alpha',
  operationSort: 'method',

  /**
   * Default settings for the API reference.
   */
  settings: defaultSettings,

  /**
   * Default routing configuration for the API reference.
   */
  routing: defaultRouting,
  /**
   * Default appearance configuration for the API reference.
   */
  appearance: defaultAppearance,

  /**
   * Default features configuration for the API reference.
   */
  features: defaultFeatures,

  /**
   * Default meta configuration for the API reference.
   */
  meta: defaultMeta,

  /**
   * Default HTTP clients for the API reference.
   */
  httpClients: AVAILABLE_CLIENTS as MutableArray<typeof AVAILABLE_CLIENTS>,
}
