import type { Plugin, Target } from '@scalar/types/snippetz'

import { cLibcurl } from '@/plugins/c/libcurl'
import { clojureCljhttp } from '@/plugins/clojure/clj_http'
import { csharpHttpclient } from '@/plugins/csharp/httpclient'
import { csharpRestsharp } from '@/plugins/csharp/restsharp'
import { dartHttp } from '@/plugins/dart/http'
import { fsharpHttpclient } from '@/plugins/fsharp/httpclient'
import { goNative } from '@/plugins/go/native'
import { httpHttp11 } from '@/plugins/http/http11'
import { javaAsynchttp } from '@/plugins/java/asynchttp'
import { javaNethttp } from '@/plugins/java/nethttp'
import { javaOkhttp } from '@/plugins/java/okhttp'
import { javaUnirest } from '@/plugins/java/unirest'
import { jsAxios } from '@/plugins/js/axios'
import { jsFetch } from '@/plugins/js/fetch'
import { jsJquery } from '@/plugins/js/jquery'
import { jsOfetch } from '@/plugins/js/ofetch'
import { jsXhr } from '@/plugins/js/xhr'
import { juliaHttp } from '@/plugins/julia/http'
import { kotlinOkhttp } from '@/plugins/kotlin/okhttp'
import { nodeAxios } from '@/plugins/node/axios'
import { nodeFetch } from '@/plugins/node/fetch'
import { nodeOfetch } from '@/plugins/node/ofetch'
import { nodeUndici } from '@/plugins/node/undici'
import { objcNsurlsession } from '@/plugins/objc/nsurlsession'
import { ocamlCohttp } from '@/plugins/ocaml/cohttp'
import { phpCurl } from '@/plugins/php/curl'
import { phpGuzzle } from '@/plugins/php/guzzle'
import { phpLaravel } from '@/plugins/php/laravel'
import { powershellRestmethod } from '@/plugins/powershell/restmethod'
import { powershellWebrequest } from '@/plugins/powershell/webrequest'
import { pythonAiohttp } from '@/plugins/python/aiohttp'
import { pythonHttpxAsync, pythonHttpxSync } from '@/plugins/python/httpx'
import { pythonPython3 } from '@/plugins/python/python3'
import { pythonRequests } from '@/plugins/python/requests'
import { rHttr2 } from '@/plugins/r/httr2'
import { rubyNative } from '@/plugins/ruby/native'
import { rustReqwest } from '@/plugins/rust/reqwest'
import { shellCurl } from '@/plugins/shell/curl'
import { shellHttpie } from '@/plugins/shell/httpie'
import { shellWget } from '@/plugins/shell/wget'
import { swiftNsurlsession } from '@/plugins/swift/nsurlsession'

import { type PluginId, clientsMetadata } from './metadata'

/**
 * Every built-in plugin, keyed by `target/client`.
 *
 * Typing the record by `PluginId` makes TypeScript flag a missing or unknown client whenever the list of
 * clients changes, the same way it does for the lazy loaders.
 */
const plugins: Record<PluginId, Plugin> = {
  'c/libcurl': cLibcurl,
  'csharp/httpclient': csharpHttpclient,
  'csharp/restsharp': csharpRestsharp,
  'clojure/clj_http': clojureCljhttp,
  'dart/http': dartHttp,
  'fsharp/httpclient': fsharpHttpclient,
  'go/native': goNative,
  'http/http1.1': httpHttp11,
  'java/asynchttp': javaAsynchttp,
  'java/nethttp': javaNethttp,
  'java/okhttp': javaOkhttp,
  'java/unirest': javaUnirest,
  'js/fetch': jsFetch,
  'js/axios': jsAxios,
  'js/ofetch': jsOfetch,
  'js/jquery': jsJquery,
  'js/xhr': jsXhr,
  'julia/http': juliaHttp,
  'kotlin/okhttp': kotlinOkhttp,
  'node/fetch': nodeFetch,
  'node/axios': nodeAxios,
  'node/ofetch': nodeOfetch,
  'node/undici': nodeUndici,
  'objc/nsurlsession': objcNsurlsession,
  'ocaml/cohttp': ocamlCohttp,
  'php/curl': phpCurl,
  'php/guzzle': phpGuzzle,
  'php/laravel': phpLaravel,
  'powershell/webrequest': powershellWebrequest,
  'powershell/restmethod': powershellRestmethod,
  'python/python3': pythonPython3,
  'python/requests': pythonRequests,
  'python/aiohttp': pythonAiohttp,
  'python/httpx_sync': pythonHttpxSync,
  'python/httpx_async': pythonHttpxAsync,
  'r/httr2': rHttr2,
  'ruby/native': rubyNative,
  'rust/reqwest': rustReqwest,
  'shell/curl': shellCurl,
  'shell/wget': shellWget,
  'shell/httpie': shellHttpie,
  'swift/nsurlsession': swiftNsurlsession,
}

/**
 * All available clients
 *
 * Targets, their titles and defaults, and the order of their clients come from `clientsMetadata`, the
 * same list the lazy entry point exposes, so the two catalogs cannot drift apart.
 */
export const clients: Target[] = clientsMetadata.map(
  (target) =>
    ({
      key: target.key,
      title: target.title,
      default: target.default,
      clients: target.clients.map(({ target, client }) => plugins[`${target}/${client}` as PluginId]),
    }) as Target,
)
