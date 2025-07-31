export type EnvironmentUtils = {
  get: (key: string) => string | undefined
  set: () => boolean
}

export const createEnvironmentUtils = (env: Record<string, any> = {}): EnvironmentUtils => ({
  get: (key: string) => env[key],
  set: () => false,
})
