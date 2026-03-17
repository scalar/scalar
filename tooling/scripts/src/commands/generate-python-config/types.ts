/** A single enum definition to generate */
export type EnumDef = {
  /** Python class name, e.g. "Theme" */
  className: string
  /** Ordered list of { memberName, value } pairs */
  members: { memberName: string; value: string }[]
}

/** A single field on a Pydantic model or config class */
export type FieldDef = {
  /** Python field name in snake_case */
  name: string
  /** The original camelCase key from the JS config */
  jsKey: string
  /** Python type annotation string, e.g. "Optional[str]" */
  pythonType: string
  /** Default value as Python source, e.g. "None", "True", '"modern"' */
  defaultValue: string
  /** Whether to use default_factory instead of default */
  useFactory: boolean
  /** Human-readable description for the Field() */
  description: string
}

/** A Pydantic model definition */
export type ModelDef = {
  /** Python class name */
  className: string
  /** Docstring */
  docstring: string
  /** Whether to set extra="forbid" */
  forbidExtra: boolean
  /** Ordered list of fields */
  fields: FieldDef[]
  /** Imports needed from other generated modules (e.g. enums, models) */
  imports: { from: string; names: string[] }[]
}
