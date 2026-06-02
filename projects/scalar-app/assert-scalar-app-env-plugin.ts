import { type Plugin, loadEnv } from 'vite'

import { assertScalarAppEnv } from './assert-scalar-app-env'

/** Fail Vite dev and build when required `VITE_*` variables are not set. */
export const assertScalarAppEnvPlugin = (envDir: string): Plugin => ({
  name: 'scalar-app-assert-env',
  config(_config, { mode }) {
    assertScalarAppEnv(loadEnv(mode, envDir, 'VITE_'))
  },
})
