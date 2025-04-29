import type { Environment } from '@scalar/oas-utils/entities/environment'

export type EnvVariables = { key: string; value: string; source: 'global' | 'collection' }[]

export type EnvConfig = {
  variables: Record<string, string | { default: string; description?: string | undefined }>
  color?: string | undefined
  description?: string | undefined
}

/** Gets the color of an environment with default fallback */
export function getEnvColor(environment: Environment): string {
  return environment?.color || '#FFFFFF'
}
