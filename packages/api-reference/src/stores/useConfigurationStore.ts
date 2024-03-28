import {
  type DeepReadonly,
  type UnwrapNestedRefs,
  reactive,
  readonly,
} from 'vue'

import type { ReferenceConfiguration } from '../types'

export const createEmptyConfigurationState = (): ReferenceConfiguration => ({})

const configuration = reactive<ReferenceConfiguration>(
  createEmptyConfigurationState(),
)

const setConfiguration = (newState: Partial<ReferenceConfiguration>) => {
  Object.assign(configuration, {
    ...configuration,
    ...newState,
  })
}

// We need to be explicit about the return type here because of this error:
//
// The inferred type of 'useConfigurationStore' cannot be named without a reference to '.pnpm/zhead@2.2.4/node_modules/zhead/dist/shared/zhead.177ad851'. This is likely not portable. A type annotation is necessary.
export const useConfigurationStore: () => {
  configuration: DeepReadonly<UnwrapNestedRefs<ReferenceConfiguration>>
  setConfiguration: (newState: Partial<ReferenceConfiguration>) => void
} = () => ({
  configuration: readonly(configuration),
  setConfiguration,
})
