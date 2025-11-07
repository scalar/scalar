import { Type } from '@scalar/typebox'

export const XScalarDocumentSecuritySchema = Type.Object({
  'x-scalar-document-security': Type.Optional(Type.Boolean()),
})

export type XScalarDocumentSecurity = {
  /**
   * XScalarDocumentSecurity Extension
   *
   * If enabled we use/set the selected security schemes on the document level
   * If disabled we use/set the selected security schemes on the operation level
   */
  'x-scalar-document-security'?: boolean
}
