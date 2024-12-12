import { cLibcurl } from '@/plugins/c/libcurl/libcurl'
import { clojureCljhttp } from '@/plugins/clojure/clj_http'
import { csharpHttpclient } from '@/plugins/csharp/httpclient'
import { csharpRestsharp } from '@/plugins/csharp/restsharp'
import { goNative } from '@/plugins/go/native'
import { httpHttp11 } from '@/plugins/http/http11'
import { javaAsynchttp } from '@/plugins/java/asynchttp'
import { javaNethttp } from '@/plugins/java/nethttp/nethttp'
import { javaOkhttp } from '@/plugins/java/okhttp/okhttp'
import { javaUnirest } from '@/plugins/java/unirest/unirest'
import { jsAxios } from '@/plugins/js/axios'
import { jsFetch } from '@/plugins/js/fetch'
import { jsJquery } from '@/plugins/js/jquery'
import { jsOfetch } from '@/plugins/js/ofetch'
import { jsXhr } from '@/plugins/js/xhr'
import { kotlinOkhttp } from '@/plugins/kotlin/okhttp'
import { nodeAxios } from '@/plugins/node/axios'
import { nodeFetch } from '@/plugins/node/fetch'
import { nodeOfetch } from '@/plugins/node/ofetch'
import { nodeUndici } from '@/plugins/node/undici'
import { objcNsurlsession } from '@/plugins/objc/nsurlsession'
import { ocamlCohttp } from '@/plugins/ocaml/cohttp'
import { phpCurl } from '@/plugins/php/curl'
import { phpGuzzle } from '@/plugins/php/guzzle'
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
import type { ClientId, HarRequest, Plugin, TargetId } from '@/types'

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
    javaAsynchttp,
    javaNethttp,
    javaOkhttp,
    javaUnirest,
    jsAxios,
    jsFetch,
    jsJquery,
    jsOfetch,
    jsXhr,
    kotlinOkhttp,
    nodeAxios,
    nodeFetch,
    nodeOfetch,
    nodeUndici,
    objcNsurlsession,
    ocamlCohttp,
    phpCurl,
    phpGuzzle,
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
      request: Partial<HarRequest>,
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
