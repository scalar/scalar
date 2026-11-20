/**
 * Lazy entry point: client metadata plus on-demand loading of the code generators.
 *
 * Unlike `@scalar/snippetz`, nothing here imports a plugin statically, so bundlers split every generator
 * into its own chunk and an app only downloads the clients it renders.
 */
export {
  AVAILABLE_CLIENTS,
  type AvailableClient,
  type AvailableClients,
  type ClientId,
  type HarRequest,
  type Plugin,
  type PluginConfiguration,
  type TargetId,
} from '@scalar/types/snippetz'

export { type PluginMetadata, type TargetMetadata, clientsMetadata } from '@/clients/metadata'

export { getLoadedPlugin, hasPlugin, loadPlugin, preloadClients, print } from './load-plugin'
