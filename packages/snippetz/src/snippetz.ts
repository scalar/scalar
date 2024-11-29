import { cLibcurl } from '@/plugins/c/libcurl/libcurl'
import { goNative } from '@/plugins/go/native'
import { httpHttp11 } from '@/plugins/http/http11'
import { jsFetch } from '@/plugins/js/fetch'
import { jsOfetch } from '@/plugins/js/ofetch'
import { nodeFetch } from '@/plugins/node/fetch'
import { nodeOfetch } from '@/plugins/node/ofetch'
import { nodeUndici } from '@/plugins/node/undici'
import { shellCurl } from '@/plugins/shell/curl'
import { shellHttpie } from '@/plugins/shell/httpie'
import { shellWget } from '@/plugins/shell/wget'

import type { ClientId, Plugin, Request, TargetId } from './core'

/**
 * Generate code examples for HAR requests
 */
export function snippetz() {
  const plugins: Plugin[] = [
    cLibcurl,
    goNative,
    jsFetch,
    jsOfetch,
    nodeFetch,
    nodeOfetch,
    nodeUndici,
    shellCurl,
    shellHttpie,
    shellWget,
    httpHttp11,
  ]

  return {
    get(target: TargetId, client: ClientId<TargetId>) {
      return this.findPlugin(target, client)
    },
    print<T extends TargetId>(
      target: T,
      client: ClientId<T>,
      request: Partial<Request>,
    ) {
      return this.get(target, client)?.generate(request)
    },
    targets() {
      return (
        plugins
          // all targets
          .map((plugin) => plugin.target)
          // unique values
          .filter((value, index, self) => self.indexOf(value) === index)
      )
    },
    clients() {
      return plugins.map((plugin) => plugin.client)
    },
    plugins() {
      return plugins.map((plugin) => {
        return {
          target: plugin.target,
          client: plugin.client,
        }
      })
    },
    findPlugin<T extends TargetId>(
      target: T | string,
      client: ClientId<T> | string,
    ) {
      return plugins.find((plugin) => {
        return plugin.target === target && plugin.client === client
      })
    },
    hasPlugin<T extends TargetId>(
      target: T | string,
      client: ClientId<T> | string,
    ) {
      return Boolean(this.findPlugin(target, client))
    },
  }
}
