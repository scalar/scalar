import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { type ComputedRef, type MaybeRefOrGetter, computed, toValue } from 'vue'

/** The schema layouts the configuration accepts */
type SchemaLayout = ApiReferenceConfiguration['schemaLayout']

/**
 * Resolves the configured schema layout into the one question every surface
 * asks: is this the tree? The comparison lives here so the layout name is
 * spelled in exactly one place, and it accepts a ref or getter so a reactive
 * prop (`() => options.schemaLayout`) keeps the computed live.
 */
export const useSchemaLayout = (
  schemaLayout: MaybeRefOrGetter<SchemaLayout | undefined>,
): { isTreeLayout: ComputedRef<boolean> } => ({
  isTreeLayout: computed(() => toValue(schemaLayout) === 'tree'),
})
