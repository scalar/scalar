import type { Environment } from '@scalar/oas-utils/entities/environment'

export type EnvVariables = { key: string; value: string; source: string }[]

/** Gets the color of an environment with default fallback */
export const getEnvColor = (environment: Environment) => (environment ? environment.color : '#8E8E8E')
