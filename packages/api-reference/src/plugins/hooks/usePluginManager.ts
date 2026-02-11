import { type InjectionKey, inject } from 'vue'

import { type PluginManager, createPluginManager } from '@/plugins/plugin-manager'

export const PLUGIN_MANAGER_SYMBOL = Symbol() as InjectionKey<PluginManager>

/**
 * Hook to access the plugin manager
 */
export const usePluginManager = (): PluginManager => {
  const manager = inject(PLUGIN_MANAGER_SYMBOL)

  // No plugin manager provided, creating a new one.
  if (!manager) {
    return createPluginManager({})
  }

  return manager
}
