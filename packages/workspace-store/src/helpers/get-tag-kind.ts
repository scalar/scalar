import type { OpenApiDocument, TagObject } from '@/schemas/v3.2/strict/openapi-document'

/** Categories with presentation behavior in Scalar. Custom kinds retain legacy navigation. */
export type TagKind = 'nav' | 'badge' | 'audience'

/** Only OpenAPI 3.2 gives tag kinds meaning; earlier documents keep their existing groups. */
export const getTagKind = (document: Pick<OpenApiDocument, 'openapi'>, tag?: TagObject): TagKind => {
  if (document.openapi.startsWith('3.2.') && (tag?.kind === 'badge' || tag?.kind === 'audience')) {
    return tag.kind
  }
  return 'nav'
}
