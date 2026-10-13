import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

/** Display-only discriminator information; symbols never enter exported API descriptions. */
export const schemaDiscriminator = Symbol('schema-discriminator')

/** A schema view can explain inferred values without adding validation constraints. */
export type DiscriminatorMetadata = {
  [schemaDiscriminator]?: {
    value?: string
    variantLabels?: string[]
  }
}

/** Schema carrying renderer-only discriminator metadata. */
export type DiscriminatorSchema = SchemaObject & DiscriminatorMetadata
