import { Type, type Static } from '@sinclair/typebox'
import { AVAILABLE_CLIENTS } from '@scalar/types/snippetz'
import { defaultMeta, MetaSchema } from '@/schemas/reference-config/meta'
import { defaultFeatures, FeaturesSchema } from '@/schemas/reference-config/features'
import { AppearanceSchema, defaultAppearance } from '@/schemas/reference-config/appearance'
import { defaultRouting, RoutingSchema } from '@/schemas/reference-config/routing'
import { defaultSettings, SettingsSchema } from '@/schemas/reference-config/settings'
import type { DeepTransform, MutableArray } from '@/types'

/**
 * ReferenceConfigSchema defines the shape of the configuration object
 * for the API Reference. All properties are optional due to Type.Partial.
 * This schema is used for validating and typing the configuration.
 */
export const ReferenceConfigSchema = Type.Partial(
  Type.Object({
    /** Document level title */
    title: Type.String(),
    /** Unique slug to identify the document */
    slug: Type.String(),
    /** Settings for the API reference (controls behavior and options) */
    settings: SettingsSchema,
    /** Tag sorting method: currently only 'alpha' (alphabetical) is supported */
    tagSort: Type.Union([Type.Literal('alpha')]),
    /** Operation sorting method: by HTTP method or alphabetically */
    operationSort: Type.Union([Type.Literal('method'), Type.Literal('alpha')]),
    /** Routing configuration (controls navigation) */
    routing: RoutingSchema,
    /** Appearance configuration (controls theming and UI options) */
    appearance: AppearanceSchema,
    /** Features configuration (toggles for enabling/disabling features) */
    features: FeaturesSchema,
    /** Meta information */
    meta: MetaSchema,
    /** List of enabled HTTP clients for code samples */
    httpClients: Type.Array(Type.Union(AVAILABLE_CLIENTS.map((client) => Type.Literal(client)))),
  }),
)

export type ReferenceConfig = Static<typeof ReferenceConfigSchema>

export const defaultReferenceConfig: DeepTransform<ReferenceConfig, 'NonNullable'> = {
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
