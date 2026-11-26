import type { Plugin } from '@scalar/types/snippetz'

import type { PluginId } from '@/clients/metadata'

/**
 * One loader per built-in client. Every entry is its own dynamic `import()`, so bundlers emit a separate
 * chunk per generator and a page only downloads the clients it actually renders.
 *
 * Typing the record by `PluginId` makes TypeScript flag a missing or unknown client whenever the
 * list of clients changes.
 */
export const pluginLoaders: Record<PluginId, () => Promise<Plugin>> = {
  'c/libcurl': () => import('@/plugins/c/libcurl').then((module) => module.cLibcurl),
  'csharp/httpclient': () => import('@/plugins/csharp/httpclient').then((module) => module.csharpHttpclient),
  'csharp/restsharp': () => import('@/plugins/csharp/restsharp').then((module) => module.csharpRestsharp),
  'clojure/clj_http': () => import('@/plugins/clojure/clj_http').then((module) => module.clojureCljhttp),
  'dart/http': () => import('@/plugins/dart/http').then((module) => module.dartHttp),
  'fsharp/httpclient': () => import('@/plugins/fsharp/httpclient').then((module) => module.fsharpHttpclient),
  'go/native': () => import('@/plugins/go/native').then((module) => module.goNative),
  'http/http1.1': () => import('@/plugins/http/http11').then((module) => module.httpHttp11),
  'java/asynchttp': () => import('@/plugins/java/asynchttp').then((module) => module.javaAsynchttp),
  'java/nethttp': () => import('@/plugins/java/nethttp').then((module) => module.javaNethttp),
  'java/okhttp': () => import('@/plugins/java/okhttp').then((module) => module.javaOkhttp),
  'java/unirest': () => import('@/plugins/java/unirest').then((module) => module.javaUnirest),
  'js/fetch': () => import('@/plugins/js/fetch').then((module) => module.jsFetch),
  'js/axios': () => import('@/plugins/js/axios').then((module) => module.jsAxios),
  'js/ofetch': () => import('@/plugins/js/ofetch').then((module) => module.jsOfetch),
  'js/jquery': () => import('@/plugins/js/jquery').then((module) => module.jsJquery),
  'js/xhr': () => import('@/plugins/js/xhr').then((module) => module.jsXhr),
  'julia/http': () => import('@/plugins/julia/http').then((module) => module.juliaHttp),
  'kotlin/okhttp': () => import('@/plugins/kotlin/okhttp').then((module) => module.kotlinOkhttp),
  'node/fetch': () => import('@/plugins/node/fetch').then((module) => module.nodeFetch),
  'node/axios': () => import('@/plugins/node/axios').then((module) => module.nodeAxios),
  'node/ofetch': () => import('@/plugins/node/ofetch').then((module) => module.nodeOfetch),
  'node/undici': () => import('@/plugins/node/undici').then((module) => module.nodeUndici),
  'objc/nsurlsession': () => import('@/plugins/objc/nsurlsession').then((module) => module.objcNsurlsession),
  'ocaml/cohttp': () => import('@/plugins/ocaml/cohttp').then((module) => module.ocamlCohttp),
  'php/curl': () => import('@/plugins/php/curl').then((module) => module.phpCurl),
  'php/guzzle': () => import('@/plugins/php/guzzle').then((module) => module.phpGuzzle),
  'php/laravel': () => import('@/plugins/php/laravel').then((module) => module.phpLaravel),
  'powershell/webrequest': () =>
    import('@/plugins/powershell/webrequest').then((module) => module.powershellWebrequest),
  'powershell/restmethod': () =>
    import('@/plugins/powershell/restmethod').then((module) => module.powershellRestmethod),
  'python/python3': () => import('@/plugins/python/python3').then((module) => module.pythonPython3),
  'python/requests': () => import('@/plugins/python/requests').then((module) => module.pythonRequests),
  'python/aiohttp': () => import('@/plugins/python/aiohttp').then((module) => module.pythonAiohttp),
  'python/httpx_sync': () => import('@/plugins/python/httpx/sync').then((module) => module.pythonHttpxSync),
  'python/httpx_async': () => import('@/plugins/python/httpx/async').then((module) => module.pythonHttpxAsync),
  'r/httr2': () => import('@/plugins/r/httr2').then((module) => module.rHttr2),
  'ruby/native': () => import('@/plugins/ruby/native').then((module) => module.rubyNative),
  'rust/reqwest': () => import('@/plugins/rust/reqwest').then((module) => module.rustReqwest),
  'shell/curl': () => import('@/plugins/shell/curl').then((module) => module.shellCurl),
  'shell/wget': () => import('@/plugins/shell/wget').then((module) => module.shellWget),
  'shell/httpie': () => import('@/plugins/shell/httpie').then((module) => module.shellHttpie),
  'swift/nsurlsession': () => import('@/plugins/swift/nsurlsession').then((module) => module.swiftNsurlsession),
}
