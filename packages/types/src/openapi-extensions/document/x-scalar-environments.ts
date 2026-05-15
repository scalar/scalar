export type XScalarEnvVar = {
  name: string
  value:
    | {
        description?: string
        default: string
      }
    | string
}

export type XScalarEnvironment = {
  description?: string
  color: string
  variables: XScalarEnvVar[]
}

export type XScalarEnvironments = {
  'x-scalar-environments'?: Record<string, XScalarEnvironment>
}
