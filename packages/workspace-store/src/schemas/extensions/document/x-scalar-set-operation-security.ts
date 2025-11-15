import { Type } from '@scalar/typebox'

export const XScalarSetOperationSecuritySchema = Type.Object({
  'x-scalar-set-operation-security': Type.Optional(Type.Boolean({ default: false })),
})

export type XScalarSetOperationSecurity = {
  /**
   * XScalarSetOperationSecurity Extension
   *
   * If enabled we set the selected security schemes at the operation level
   * If disabled/undefined we set the selected security schemes at the document level
   */
  'x-scalar-set-operation-security'?: boolean
}
