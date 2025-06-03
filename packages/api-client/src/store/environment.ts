import type { StoreContext } from '@/store/store-context'
import { type Environment, environmentSchema } from '@scalar/oas-utils/entities/environment'
import { LS_KEYS } from '@scalar/helpers/object/local-storage'
import { mutationFactory } from '@scalar/object-utils/mutator-record'
import { reactive } from 'vue'

/** Generate reactive environments for the workspace */
export function createStoreEnvironments(useLocalStorage: boolean) {
  /** Initialize default environment */
  const environments = reactive<Record<string, Environment>>({})
  const environmentMutators = mutationFactory(environments, reactive({}), useLocalStorage && LS_KEYS.ENVIRONMENT)

  // Add default environment
  environmentMutators.add(
    environmentSchema.parse({
      uid: 'default',
      name: 'Default Environment',
      color: '#FFFFFF',
      value: JSON.stringify({ exampleKey: 'exampleValue' }, null, 2),
      isDefault: true,
    }),
  )

  return {
    environments,
    environmentMutators,
  }
}

/** Extended environment data factory where workspace access is needed */
export function extendedEnvironmentDataFactory({ environmentMutators }: StoreContext) {
  /** prevent deletion of the default environment */
  const deleteEnvironment = (uid: Environment['uid']) => {
    if (uid === 'default') {
      console.warn('Default environment cannot be deleted.')
      return
    }
    environmentMutators.delete(uid)
  }

  return { deleteEnvironment }
}
