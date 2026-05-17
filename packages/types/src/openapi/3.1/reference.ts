export type ReferenceType<Value> = Value | (ReferenceObject & { '$ref-value': Value })

export type ReferenceObject = {
  /** REQUIRED. The reference identifier. This MUST be in the form of a URI. */
  '$ref': string
  /** A short summary which by default SHOULD override that of the referenced component. If the referenced object-type does not allow a summary field, then this field has no effect. */
  summary?: string
  /** A description which by default SHOULD override that of the referenced component. CommonMark syntax MAY be used for rich text representation. If the referenced object-type does not allow a description field, then this field has no effect. */
  description?: string
  /** Indicates the current status of the reference resolution. Can be either 'loading' while fetching the reference or 'error' if the resolution failed. */
  '$status'?: 'loading' | 'error'
  /** Indicates whether this reference should be resolved globally across all documents, rather than just within the current document context. */
  '$global'?: boolean
}
