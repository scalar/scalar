import { type Static, Type } from '@scalar/typebox'
import { AVAILABLE_CLIENTS } from '@scalar/types/snippetz'
import type { RequiredDeep } from 'type-fest'

import { AppearanceSchema, defaultAppearance } from '@/schemas/reference-config/appearance'
import { FeaturesSchema, defaultFeatures } from '@/schemas/reference-config/features'
import { MetaSchema, defaultMeta } from '@/schemas/reference-config/meta'
import { RoutingSchema, defaultRouting } from '@/schemas/reference-config/routing'
import { SettingsSchema, defaultSettings } from '@/schemas/reference-config/settings'
import type { MutableArray } from '@/types'

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

export const defaultReferenceConfig: RequiredDeep<ReferenceConfig> = {
  title: 'Scalar API Reference',
  slug: 'scalar-api-reference',

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
