import type { XInternal } from '@scalar/types/extensions/document/x-internal'
import type { XScalarIgnore } from '@scalar/types/extensions/document/x-scalar-ignore'
import type { XScalarOrder } from '@scalar/types/extensions/general/x-scalar-order'
import type { XDisplayName } from '@scalar/types/extensions/tag/x-display-name'

import type { ExternalDocumentationObject } from './external-documentation'

export type TagObject = {
  /** REQUIRED. The name of the tag. */
  name: string
  /** A description for the tag. CommonMark syntax MAY be used for rich text representation. */
  description?: string
  /** Additional external documentation for this tag. */
  externalDocs?: ExternalDocumentationObject
} & XDisplayName &
  XInternal &
  XScalarIgnore &
  XScalarOrder
