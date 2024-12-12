import { clients } from '@/clients'
import type { ClientId, HarRequest, TargetId } from '@/types'

/**
 * Generate code examples for HAR requests
 */
export function snippetz() {
  return {
    print<T extends TargetId>(
      target: T,
      client: ClientId<T>,
      request: Partial<HarRequest>,
    ) {
      return this.findPlugin(target, client)?.generate(request)
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
    findPlugin<T extends TargetId>(
      target: T | string,
      client: ClientId<T> | string,
    ) {
      return clients
        .find(({ key }) => key === target)
        ?.clients.find((plugin) => plugin.client === client)
    },
    hasPlugin<T extends TargetId>(
      target: T | string,
      client: ClientId<T> | string,
    ) {
      return Boolean(this.findPlugin(target, client))
    },
  }
}
