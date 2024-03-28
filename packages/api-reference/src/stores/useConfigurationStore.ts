import { reactive, readonly } from 'vue'

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

export const useConfigurationStore = () => ({
  configuration: readonly(configuration),
  setConfiguration,
})
