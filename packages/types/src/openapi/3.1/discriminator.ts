export type DiscriminatorObject = {
  /** REQUIRED. The name of the property in the payload that will hold the discriminating value. This property SHOULD be required in the payload schema, as the behavior when the property is absent is undefined. */
  propertyName: string
  /** An object to hold mappings between payload values and schema names or URI references. */
  mapping?: Record<string, string>
}
