import { clients } from '@/clients'
import type { ClientId, HarRequest, TargetId } from '@scalar/types/snippetz'

/**
 * Generate code examples for HAR requests
 */
export function snippetz() {
  function findPlugin<T extends TargetId>(target: T | string, client: ClientId<T> | string) {
    return clients.find(({ key }) => key === target)?.clients.find((plugin) => plugin.client === client)
  }

  return {
    print<T extends TargetId>(target: T, client: ClientId<T>, request: Partial<HarRequest>) {
      return findPlugin(target, client)?.generate(request)
    },
    clients() {
      return clients
    },
    plugins() {
      return clients.flatMap(({ key, clients }) =>
        clients.map((plugin) => ({
          target: key,
          client: plugin.client,
        })),
      )
    },
    findPlugin,
    hasPlugin<T extends TargetId>(target: T | string, client: ClientId<T> | string) {
      return Boolean(findPlugin(target, client))
    },
  }
}
