import type { Environment } from '@scalar/oas-utils/entities/environment'

export type EnvVariables = { key: string; value: string; source: 'global' | 'collection' }[]

/** Gets the color of an environment with default fallback */
export function getEnvColor(environment: Environment): string {
  return environment?.color || '#FFFFFF'
}
