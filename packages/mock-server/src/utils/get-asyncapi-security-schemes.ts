import type { AsyncApiDocument, AsyncApiSecuritySchemeObject } from '@scalar/types/asyncapi/3.1'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'

/** Collect component and inline security schemes, including operation traits. */
export const getAsyncApiSecuritySchemes = (
  document: AsyncApiDocument,
): Array<AsyncApiSecuritySchemeObject | undefined> => {
  const components = getResolvedRef(document.components)
  // AsyncAPI also permits inline schemes on servers, operations, and operation traits.
  return [
    ...Object.values(components?.securitySchemes ?? {}),
    ...Object.values(document.servers ?? {}).flatMap((server) => getResolvedRef(server)?.security ?? []),
    ...Object.values(document.operations ?? {}).flatMap((rawOperation) => {
      const operation = getResolvedRef(rawOperation)
      return [
        ...(operation?.security ?? []),
        ...(operation?.traits ?? []).flatMap((trait) => getResolvedRef(trait)?.security ?? []),
      ]
    }),
  ].map((scheme) => getResolvedRef(scheme))
}
