import { type InjectionKey, inject } from 'vue'

import { type PluginManager, createPluginManager } from '@/plugins/plugin-manager'

export const PLUGIN_MANAGER_SYMBOL: InjectionKey<PluginManager> = Symbol()

// With no plugins or authentication, this manager has no per-reference state.
// Share it so standalone schema blocks do not each allocate an empty manager.
const fallbackPluginManager = createPluginManager({})

/**
 * Hook to access the plugin manager
 */
export const usePluginManager = (): PluginManager => inject(PLUGIN_MANAGER_SYMBOL, fallbackPluginManager)
