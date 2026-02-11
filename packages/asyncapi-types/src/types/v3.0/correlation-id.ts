export type CorrelationIdObject = {
  /** A description of the identifier. CommonMark syntax MAY be used for rich text representation. */
  description?: string
  /** REQUIRED. A runtime expression that specifies the location of the correlation ID. */
  location: string
}
