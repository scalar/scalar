import { HTTPSnippet } from 'httpsnippet-lite'

import type {
  ClientId,
  HarRequest,
  Request,
  SnippetTargetId,
  TargetId,
} from './core'
import { fetch as jsFetch } from './plugins/js/fetch'
import { ofetch as jsOFetch } from './plugins/js/ofetch'
import { fetch as nodeFetch } from './plugins/node/fetch'
import { ofetch as nodeOFetch } from './plugins/node/ofetch'
import { undici } from './plugins/node/undici'

export function snippetz() {
  const plugins = [undici, nodeFetch, jsFetch, jsOFetch, nodeOFetch]

  return {
    get(target: TargetId, client: ClientId, request: Partial<Request>) {
      const plugin = this.findPlugin(target, client)

      if (plugin) {
        return plugin(request)
      }
    },
    print(target: TargetId, client: ClientId, request: Partial<Request>) {
      return this.get(target, client, request)?.code
    },
    targets() {
      return (
        plugins
          // all targets
          .map((plugin) => plugin().target)
          // unique values
          .filter((value, index, self) => self.indexOf(value) === index)
      )
    },
    clients() {
      return plugins.map((plugin) => plugin().client)
    },
    plugins() {
      return plugins.map((plugin) => {
        const details = plugin()

        return {
          target: details.target,
          client: details.client,
        }
      })
    },
    findPlugin(target: TargetId, client: ClientId) {
      return plugins.find((plugin) => {
        const details = plugin()

        return details.target === target && details.client === client
      })
    },
    hasPlugin(target: string, client: string) {
      return Boolean(this.findPlugin(target as TargetId, client as ClientId))
    },
    async convert(request: any, target: string, client?: string) {
      const snippet = new HTTPSnippet(request as HarRequest)

      // https://www.npmjs.com/package/httpsnippet-lite#snippetconverttargetid-string-clientid-string-options-t
      // snippet.convert(targetId: string, clientId?: string, options?: T)
      // ERROR: convert method is looking for Client not ClientId
      return (await snippet.convert(
        target as SnippetTargetId,
        client as any,
      )) as string
    },
  }
}
