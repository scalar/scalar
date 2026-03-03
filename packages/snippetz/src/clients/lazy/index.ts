import type { Plugin } from '@scalar/types/snippetz'

/**
 * All plugins with lazy-loaded generators.
 *
 * This module is ~2-3KB — it contains only metadata (target, targetTitle, client, title)
 * plus thin async `generate()` wrappers that call `import()` on first use.
 * Bundlers like Vite will code-split each dynamic import into a separate chunk.
 *
 * Pass this to `snippetz(plugins)` for the "metadata upfront, code on demand" pattern.
 */
export const plugins: Plugin[] = [
  // C
  {
    target: 'c',
    targetTitle: 'C',
    client: 'libcurl',
    title: 'Libcurl',
    async generate(request, config) {
      const { cLibcurl } = await import('../../plugins/c/libcurl/index.js')
      return cLibcurl.generate(request, config)
    },
  },
  // C# (default: restsharp)
  {
    target: 'csharp',
    targetTitle: 'C#',
    client: 'restsharp',
    title: 'RestSharp',
    async generate(request, config) {
      const { csharpRestsharp } = await import('../../plugins/csharp/restsharp/index.js')
      return csharpRestsharp.generate(request, config)
    },
  },
  {
    target: 'csharp',
    targetTitle: 'C#',
    client: 'httpclient',
    title: 'HttpClient',
    async generate(request, config) {
      const { csharpHttpclient } = await import('../../plugins/csharp/httpclient/index.js')
      return csharpHttpclient.generate(request, config)
    },
  },
  // Clojure
  {
    target: 'clojure',
    targetTitle: 'Clojure',
    client: 'clj_http',
    title: 'clj-http',
    async generate(request, config) {
      const { clojureCljhttp } = await import('../../plugins/clojure/clj_http/index.js')
      return clojureCljhttp.generate(request, config)
    },
  },
  // Dart
  {
    target: 'dart',
    targetTitle: 'Dart',
    client: 'http',
    title: 'Http',
    async generate(request, config) {
      const { dartHttp } = await import('../../plugins/dart/http/index.js')
      return dartHttp.generate(request, config)
    },
  },
  // F#
  {
    target: 'fsharp',
    targetTitle: 'F#',
    client: 'httpclient',
    title: 'HttpClient',
    async generate(request, config) {
      const { fsharpHttpclient } = await import('../../plugins/fsharp/httpclient/index.js')
      return fsharpHttpclient.generate(request, config)
    },
  },
  // Go
  {
    target: 'go',
    targetTitle: 'Go',
    client: 'native',
    title: 'NewRequest',
    async generate(request, config) {
      const { goNative } = await import('../../plugins/go/native/index.js')
      return goNative.generate(request, config)
    },
  },
  // HTTP
  {
    target: 'http',
    targetTitle: 'HTTP',
    client: 'http1.1',
    title: 'HTTP/1.1',
    async generate(request, config) {
      const { httpHttp11 } = await import('../../plugins/http/http11/index.js')
      return httpHttp11.generate(request, config)
    },
  },
  // Java (default: unirest)
  {
    target: 'java',
    targetTitle: 'Java',
    client: 'unirest',
    title: 'Unirest',
    async generate(request, config) {
      const { javaUnirest } = await import('../../plugins/java/unirest/index.js')
      return javaUnirest.generate(request, config)
    },
  },
  {
    target: 'java',
    targetTitle: 'Java',
    client: 'asynchttp',
    title: 'AsyncHttp',
    async generate(request, config) {
      const { javaAsynchttp } = await import('../../plugins/java/asynchttp/index.js')
      return javaAsynchttp.generate(request, config)
    },
  },
  {
    target: 'java',
    targetTitle: 'Java',
    client: 'nethttp',
    title: 'java.net.http',
    async generate(request, config) {
      const { javaNethttp } = await import('../../plugins/java/nethttp/index.js')
      return javaNethttp.generate(request, config)
    },
  },
  {
    target: 'java',
    targetTitle: 'Java',
    client: 'okhttp',
    title: 'OkHttp',
    async generate(request, config) {
      const { javaOkhttp } = await import('../../plugins/java/okhttp/index.js')
      return javaOkhttp.generate(request, config)
    },
  },
  // JavaScript (default: fetch)
  {
    target: 'js',
    targetTitle: 'JavaScript',
    client: 'fetch',
    title: 'Fetch',
    async generate(request, config) {
      const { jsFetch } = await import('../../plugins/js/fetch/index.js')
      return jsFetch.generate(request, config)
    },
  },
  {
    target: 'js',
    targetTitle: 'JavaScript',
    client: 'axios',
    title: 'Axios',
    async generate(request, config) {
      const { jsAxios } = await import('../../plugins/js/axios/index.js')
      return jsAxios.generate(request, config)
    },
  },
  {
    target: 'js',
    targetTitle: 'JavaScript',
    client: 'ofetch',
    title: 'ofetch',
    async generate(request, config) {
      const { jsOfetch } = await import('../../plugins/js/ofetch/index.js')
      return jsOfetch.generate(request, config)
    },
  },
  {
    target: 'js',
    targetTitle: 'JavaScript',
    client: 'jquery',
    title: 'jQuery',
    async generate(request, config) {
      const { jsJquery } = await import('../../plugins/js/jquery/index.js')
      return jsJquery.generate(request, config)
    },
  },
  {
    target: 'js',
    targetTitle: 'JavaScript',
    client: 'xhr',
    title: 'XHR',
    async generate(request, config) {
      const { jsXhr } = await import('../../plugins/js/xhr/index.js')
      return jsXhr.generate(request, config)
    },
  },
  // Kotlin
  {
    target: 'kotlin',
    targetTitle: 'Kotlin',
    client: 'okhttp',
    title: 'OkHttp',
    async generate(request, config) {
      const { kotlinOkhttp } = await import('../../plugins/kotlin/okhttp/index.js')
      return kotlinOkhttp.generate(request, config)
    },
  },
  // Node.js (default: fetch)
  {
    target: 'node',
    targetTitle: 'Node.js',
    client: 'fetch',
    title: 'Fetch',
    async generate(request, config) {
      const { nodeFetch } = await import('../../plugins/node/fetch/index.js')
      return nodeFetch.generate(request, config)
    },
  },
  {
    target: 'node',
    targetTitle: 'Node.js',
    client: 'axios',
    title: 'Axios',
    async generate(request, config) {
      const { nodeAxios } = await import('../../plugins/node/axios/index.js')
      return nodeAxios.generate(request, config)
    },
  },
  {
    target: 'node',
    targetTitle: 'Node.js',
    client: 'ofetch',
    title: 'ofetch',
    async generate(request, config) {
      const { nodeOfetch } = await import('../../plugins/node/ofetch/index.js')
      return nodeOfetch.generate(request, config)
    },
  },
  {
    target: 'node',
    targetTitle: 'Node.js',
    client: 'undici',
    title: 'undici',
    async generate(request, config) {
      const { nodeUndici } = await import('../../plugins/node/undici/index.js')
      return nodeUndici.generate(request, config)
    },
  },
  // Objective-C
  {
    target: 'objc',
    targetTitle: 'Objective-C',
    client: 'nsurlsession',
    title: 'NSURLSession',
    async generate(request, config) {
      const { objcNsurlsession } = await import('../../plugins/objc/nsurlsession/index.js')
      return objcNsurlsession.generate(request, config)
    },
  },
  // OCaml
  {
    target: 'ocaml',
    targetTitle: 'OCaml',
    client: 'cohttp',
    title: 'Cohttp',
    async generate(request, config) {
      const { ocamlCohttp } = await import('../../plugins/ocaml/cohttp/index.js')
      return ocamlCohttp.generate(request, config)
    },
  },
  // PHP (default: curl)
  {
    target: 'php',
    targetTitle: 'PHP',
    client: 'curl',
    title: 'cURL',
    async generate(request, config) {
      const { phpCurl } = await import('../../plugins/php/curl/index.js')
      return phpCurl.generate(request, config)
    },
  },
  {
    target: 'php',
    targetTitle: 'PHP',
    client: 'guzzle',
    title: 'Guzzle',
    async generate(request, config) {
      const { phpGuzzle } = await import('../../plugins/php/guzzle/index.js')
      return phpGuzzle.generate(request, config)
    },
  },
  // PowerShell (default: webrequest)
  {
    target: 'powershell',
    targetTitle: 'PowerShell',
    client: 'webrequest',
    title: 'Invoke-WebRequest',
    async generate(request, config) {
      const { powershellWebrequest } = await import('../../plugins/powershell/webrequest/index.js')
      return powershellWebrequest.generate(request, config)
    },
  },
  {
    target: 'powershell',
    targetTitle: 'PowerShell',
    client: 'restmethod',
    title: 'Invoke-RestMethod',
    async generate(request, config) {
      const { powershellRestmethod } = await import('../../plugins/powershell/restmethod/index.js')
      return powershellRestmethod.generate(request, config)
    },
  },
  // Python (default: python3)
  {
    target: 'python',
    targetTitle: 'Python',
    client: 'python3',
    title: 'http.client',
    async generate(request, config) {
      const { pythonPython3 } = await import('../../plugins/python/python3/index.js')
      return pythonPython3.generate(request, config)
    },
  },
  {
    target: 'python',
    targetTitle: 'Python',
    client: 'requests',
    title: 'Requests',
    async generate(request, config) {
      const { pythonRequests } = await import('../../plugins/python/requests/index.js')
      return pythonRequests.generate(request, config)
    },
  },
  {
    target: 'python',
    targetTitle: 'Python',
    client: 'httpx_sync',
    title: 'HTTPX (Sync)',
    async generate(request, config) {
      const { pythonHttpxSync } = await import('../../plugins/python/httpx/index.js')
      return pythonHttpxSync.generate(request, config)
    },
  },
  {
    target: 'python',
    targetTitle: 'Python',
    client: 'httpx_async',
    title: 'HTTPX (Async)',
    async generate(request, config) {
      const { pythonHttpxAsync } = await import('../../plugins/python/httpx/index.js')
      return pythonHttpxAsync.generate(request, config)
    },
  },
  // R
  {
    target: 'r',
    targetTitle: 'R',
    client: 'httr',
    title: 'httr',
    async generate(request, config) {
      const { rHttr } = await import('../../plugins/r/httr/index.js')
      return rHttr.generate(request, config)
    },
  },
  // Ruby
  {
    target: 'ruby',
    targetTitle: 'Ruby',
    client: 'native',
    title: 'net::http',
    async generate(request, config) {
      const { rubyNative } = await import('../../plugins/ruby/native/index.js')
      return rubyNative.generate(request, config)
    },
  },
  // Rust
  {
    target: 'rust',
    targetTitle: 'Rust',
    client: 'reqwest',
    title: 'reqwest',
    async generate(request, config) {
      const { rustReqwest } = await import('../../plugins/rust/reqwest/index.js')
      return rustReqwest.generate(request, config)
    },
  },
  // Shell (default: curl)
  {
    target: 'shell',
    targetTitle: 'Shell',
    client: 'curl',
    title: 'Curl',
    async generate(request, config) {
      const { shellCurl } = await import('../../plugins/shell/curl/index.js')
      return shellCurl.generate(request, config)
    },
  },
  {
    target: 'shell',
    targetTitle: 'Shell',
    client: 'wget',
    title: 'Wget',
    async generate(request, config) {
      const { shellWget } = await import('../../plugins/shell/wget/index.js')
      return shellWget.generate(request, config)
    },
  },
  {
    target: 'shell',
    targetTitle: 'Shell',
    client: 'httpie',
    title: 'HTTPie',
    async generate(request, config) {
      const { shellHttpie } = await import('../../plugins/shell/httpie/index.js')
      return shellHttpie.generate(request, config)
    },
  },
  // Swift
  {
    target: 'swift',
    targetTitle: 'Swift',
    client: 'nsurlsession',
    title: 'NSURLSession',
    async generate(request, config) {
      const { swiftNsurlsession } = await import('../../plugins/swift/nsurlsession/index.js')
      return swiftNsurlsession.generate(request, config)
    },
  },
]
