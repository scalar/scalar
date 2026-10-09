import type { DiscriminatorObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

/** Finds the payload values explicitly mapped to a referenced composition member. */
export const getDiscriminatorValues = (ref: string | undefined, mapping: DiscriminatorObject['mapping']): string[] => {
  if (!ref || !mapping) {
    return []
  }

  // A mapping can use either a URI reference or a local component name. Match
  // the whole reference so external schemas with the same name stay distinct.
  return Object.entries(mapping)
    .filter(([, target]) => target === ref || `#/components/schemas/${target}` === ref)
    .map(([value]) => value)
}
