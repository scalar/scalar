import { cLibcurl } from '@/plugins/c/libcurl/libcurl'
import { clojureCljhttp } from '@/plugins/clojure/clj_http'
import { csharpHttpclient } from '@/plugins/csharp/httpclient'
import { csharpRestsharp } from '@/plugins/csharp/restsharp'
import { goNative } from '@/plugins/go/native'
import { httpHttp11 } from '@/plugins/http/http11'
import { jsFetch } from '@/plugins/js/fetch'
import { jsOfetch } from '@/plugins/js/ofetch'
import { nodeFetch } from '@/plugins/node/fetch'
import { nodeOfetch } from '@/plugins/node/ofetch'
import { nodeUndici } from '@/plugins/node/undici'
import { powershellRestmethod } from '@/plugins/powershell/restmethod'
import { powershellWebrequest } from '@/plugins/powershell/webrequest'
import { pythonPython3 } from '@/plugins/python/python3'
import { pythonRequests } from '@/plugins/python/requests'
import { rHttr } from '@/plugins/r/httr'
import { rubyNative } from '@/plugins/ruby/native'
import { shellCurl } from '@/plugins/shell/curl'
import { shellHttpie } from '@/plugins/shell/httpie'
import { shellWget } from '@/plugins/shell/wget'
import { swiftNsurlsession } from '@/plugins/swift/nsurlsession'

import type { ClientId, Plugin, Request, TargetId } from './core'

/**
 * Generate code examples for HAR requests
 */
export function snippetz() {
  const plugins: Plugin[] = [
    cLibcurl,
    clojureCljhttp,
    csharpHttpclient,
    csharpRestsharp,
    goNative,
    httpHttp11,
    jsFetch,
    jsOfetch,
    nodeFetch,
    nodeOfetch,
    nodeUndici,
    powershellRestmethod,
    powershellWebrequest,
    pythonPython3,
    pythonRequests,
    rHttr,
    rubyNative,
    shellCurl,
    shellHttpie,
    shellWget,
    swiftNsurlsession,
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
