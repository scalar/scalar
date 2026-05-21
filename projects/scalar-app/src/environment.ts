import { type ScalarAppEnv, assertScalarAppEnv } from '../assert-scalar-app-env'

export type { ScalarAppEnv }

export const env = assertScalarAppEnv(import.meta.env)
