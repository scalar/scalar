export type ExternalDocumentationObject = {
  /** REQUIRED. The URI for the target documentation. This MUST be in the form of a URI. */
  url: string
  /** A description of the target documentation. CommonMark syntax MAY be used for rich text representation. */
  description?: string
}
