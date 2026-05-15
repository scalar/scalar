export type DisableParametersConfig = {
  'global-cookies'?: Record<string, Record<string, boolean>>
  'global-headers'?: Record<string, Record<string, boolean>>
  'default-headers'?: Record<string, Record<string, boolean>>
}

export type XScalarDisableParameters = {
  'x-scalar-disable-parameters'?: DisableParametersConfig
}
