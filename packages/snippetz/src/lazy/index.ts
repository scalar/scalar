import type { Plugin, Target } from '@scalar/types/snippetz'

type LazyTarget = Omit<Target, 'clients'> & {
  clients: (Omit<Plugin, 'generate'> & { load: () => Promise<Plugin> })[]
}

const clients = [
  {
    key: 'c',
    title: 'C',
    default: 'libcurl',
    clients: [
      {
        target: 'c',
        client: 'libcurl',
        title: 'Libcurl',
        load: () => import('../plugins/c/libcurl').then((module) => module.cLibcurl),
      },
    ],
  },
  {
    key: 'csharp',
    title: 'C#',
    default: 'restsharp',
    clients: [
      {
        target: 'csharp',
        client: 'httpclient',
        title: 'HttpClient',
        load: () => import('../plugins/csharp/httpclient').then((module) => module.csharpHttpclient),
      },
      {
        target: 'csharp',
        client: 'restsharp',
        title: 'RestSharp',
        load: () => import('../plugins/csharp/restsharp').then((module) => module.csharpRestsharp),
      },
    ],
  },
  {
    key: 'clojure',
    title: 'Clojure',
    default: 'clj_http',
    clients: [
      {
        target: 'clojure',
        client: 'clj_http',
        title: 'clj-http',
        load: () => import('../plugins/clojure/clj_http').then((module) => module.clojureCljhttp),
      },
    ],
  },
  {
    key: 'dart',
    title: 'Dart',
    default: 'http',
    clients: [
      {
        target: 'dart',
        client: 'http',
        title: 'Http',
        load: () => import('../plugins/dart/http').then((module) => module.dartHttp),
      },
    ],
  },
  {
    key: 'fsharp',
    title: 'F#',
    default: 'httpclient',
    clients: [
      {
        target: 'fsharp',
        client: 'httpclient',
        title: 'HttpClient',
        load: () => import('../plugins/fsharp/httpclient').then((module) => module.fsharpHttpclient),
      },
    ],
  },
  {
    key: 'go',
    title: 'Go',
    default: 'native',
    clients: [
      {
        target: 'go',
        client: 'native',
        title: 'NewRequest',
        load: () => import('../plugins/go/native').then((module) => module.goNative),
      },
    ],
  },
  {
    key: 'http',
    title: 'HTTP',
    default: 'http1.1',
    clients: [
      {
        target: 'http',
        client: 'http1.1',
        title: 'HTTP/1.1',
        load: () => import('../plugins/http/http11').then((module) => module.httpHttp11),
      },
    ],
  },
  {
    key: 'java',
    title: 'Java',
    default: 'unirest',
    clients: [
      {
        target: 'java',
        client: 'asynchttp',
        title: 'AsyncHttp',
        load: () => import('../plugins/java/asynchttp').then((module) => module.javaAsynchttp),
      },
      {
        target: 'java',
        client: 'nethttp',
        title: 'java.net.http',
        load: () => import('../plugins/java/nethttp').then((module) => module.javaNethttp),
      },
      {
        target: 'java',
        client: 'okhttp',
        title: 'OkHttp',
        load: () => import('../plugins/java/okhttp').then((module) => module.javaOkhttp),
      },
      {
        target: 'java',
        client: 'unirest',
        title: 'Unirest',
        load: () => import('../plugins/java/unirest').then((module) => module.javaUnirest),
      },
    ],
  },
  {
    key: 'js',
    title: 'JavaScript',
    default: 'fetch',
    clients: [
      {
        target: 'js',
        client: 'fetch',
        title: 'Fetch',
        load: () => import('../plugins/js/fetch').then((module) => module.jsFetch),
      },
      {
        target: 'js',
        client: 'axios',
        title: 'Axios',
        load: () => import('../plugins/js/axios').then((module) => module.jsAxios),
      },
      {
        target: 'js',
        client: 'ofetch',
        title: 'ofetch',
        load: () => import('../plugins/js/ofetch').then((module) => module.jsOfetch),
      },
      {
        target: 'js',
        client: 'jquery',
        title: 'jQuery',
        load: () => import('../plugins/js/jquery').then((module) => module.jsJquery),
      },
      {
        target: 'js',
        client: 'xhr',
        title: 'XHR',
        load: () => import('../plugins/js/xhr').then((module) => module.jsXhr),
      },
    ],
  },
  {
    key: 'julia',
    title: 'Julia',
    default: 'http',
    clients: [
      {
        target: 'julia',
        client: 'http',
        title: 'HTTP.jl',
        load: () => import('../plugins/julia/http').then((module) => module.juliaHttp),
      },
    ],
  },
  {
    key: 'kotlin',
    title: 'Kotlin',
    default: 'okhttp',
    clients: [
      {
        target: 'kotlin',
        client: 'okhttp',
        title: 'OkHttp',
        load: () => import('../plugins/kotlin/okhttp').then((module) => module.kotlinOkhttp),
      },
    ],
  },
  {
    key: 'node',
    title: 'Node.js',
    default: 'fetch',
    clients: [
      {
        target: 'node',
        client: 'fetch',
        title: 'Fetch',
        load: () => import('../plugins/node/fetch').then((module) => module.nodeFetch),
      },
      {
        target: 'node',
        client: 'axios',
        title: 'Axios',
        load: () => import('../plugins/node/axios').then((module) => module.nodeAxios),
      },
      {
        target: 'node',
        client: 'ofetch',
        title: 'ofetch',
        load: () => import('../plugins/node/ofetch').then((module) => module.nodeOfetch),
      },
      {
        target: 'node',
        client: 'undici',
        title: 'undici',
        load: () => import('../plugins/node/undici').then((module) => module.nodeUndici),
      },
    ],
  },
  {
    key: 'objc',
    title: 'Objective-C',
    default: 'nsurlsession',
    clients: [
      {
        target: 'objc',
        client: 'nsurlsession',
        title: 'NSURLSession',
        load: () => import('../plugins/objc/nsurlsession').then((module) => module.objcNsurlsession),
      },
    ],
  },
  {
    key: 'ocaml',
    title: 'OCaml',
    default: 'cohttp',
    clients: [
      {
        target: 'ocaml',
        client: 'cohttp',
        title: 'Cohttp',
        load: () => import('../plugins/ocaml/cohttp').then((module) => module.ocamlCohttp),
      },
    ],
  },
  {
    key: 'php',
    title: 'PHP',
    default: 'curl',
    clients: [
      {
        target: 'php',
        client: 'curl',
        title: 'cURL',
        load: () => import('../plugins/php/curl').then((module) => module.phpCurl),
      },
      {
        target: 'php',
        client: 'guzzle',
        title: 'Guzzle',
        load: () => import('../plugins/php/guzzle').then((module) => module.phpGuzzle),
      },
      {
        target: 'php',
        client: 'laravel',
        title: 'Laravel HTTP Client',
        load: () => import('../plugins/php/laravel').then((module) => module.phpLaravel),
      },
    ],
  },
  {
    key: 'powershell',
    title: 'PowerShell',
    default: 'webrequest',
    clients: [
      {
        target: 'powershell',
        client: 'webrequest',
        title: 'Invoke-WebRequest',
        load: () => import('../plugins/powershell/webrequest').then((module) => module.powershellWebrequest),
      },
      {
        target: 'powershell',
        client: 'restmethod',
        title: 'Invoke-RestMethod',
        load: () => import('../plugins/powershell/restmethod').then((module) => module.powershellRestmethod),
      },
    ],
  },
  {
    key: 'python',
    title: 'Python',
    default: 'python3',
    clients: [
      {
        target: 'python',
        client: 'python3',
        title: 'http.client',
        load: () => import('../plugins/python/python3').then((module) => module.pythonPython3),
      },
      {
        target: 'python',
        client: 'requests',
        title: 'Requests',
        load: () => import('../plugins/python/requests').then((module) => module.pythonRequests),
      },
      {
        target: 'python',
        client: 'aiohttp',
        title: 'aiohttp',
        load: () => import('../plugins/python/aiohttp').then((module) => module.pythonAiohttp),
      },
      {
        target: 'python',
        client: 'httpx_sync',
        title: 'HTTPX (Sync)',
        load: () => import('../plugins/python/httpx').then((module) => module.pythonHttpxSync),
      },
      {
        target: 'python',
        client: 'httpx_async',
        title: 'HTTPX (Async)',
        load: () => import('../plugins/python/httpx').then((module) => module.pythonHttpxAsync),
      },
    ],
  },
  {
    key: 'r',
    title: 'R',
    default: 'httr2',
    clients: [
      {
        target: 'r',
        client: 'httr2',
        title: 'httr2',
        load: () => import('../plugins/r/httr2').then((module) => module.rHttr2),
      },
    ],
  },
  {
    key: 'ruby',
    title: 'Ruby',
    default: 'native',
    clients: [
      {
        target: 'ruby',
        client: 'native',
        title: 'net::http',
        load: () => import('../plugins/ruby/native').then((module) => module.rubyNative),
      },
    ],
  },
  {
    key: 'rust',
    title: 'Rust',
    default: 'reqwest',
    clients: [
      {
        target: 'rust',
        client: 'reqwest',
        title: 'reqwest',
        load: () => import('../plugins/rust/reqwest').then((module) => module.rustReqwest),
      },
    ],
  },
  {
    key: 'shell',
    title: 'Shell',
    default: 'curl',
    clients: [
      {
        target: 'shell',
        client: 'curl',
        title: 'Curl',
        load: () => import('../plugins/shell/curl').then((module) => module.shellCurl),
      },
      {
        target: 'shell',
        client: 'wget',
        title: 'Wget',
        load: () => import('../plugins/shell/wget').then((module) => module.shellWget),
      },
      {
        target: 'shell',
        client: 'httpie',
        title: 'HTTPie',
        load: () => import('../plugins/shell/httpie').then((module) => module.shellHttpie),
      },
    ],
  },
  {
    key: 'swift',
    title: 'Swift',
    default: 'nsurlsession',
    clients: [
      {
        target: 'swift',
        client: 'nsurlsession',
        title: 'NSURLSession',
        load: () => import('../plugins/swift/nsurlsession').then((module) => module.swiftNsurlsession),
      },
    ],
  },
] satisfies LazyTarget[]

/** Client names and ordering without importing their generators. */
export const clientMetadata = clients.map((group) => ({
  key: group.key,
  title: group.title,
  default: group.default,
  clients: group.clients.map(({ target, client, title }) => ({ target, client, title })),
}))

const pending = new Map<string, Promise<Plugin>>()

/** Load one generator, sharing concurrent requests and allowing failed loads to retry. */
export const loadPlugin = (id: string): Promise<Plugin | undefined> => {
  const group = clients.find((group) => id.startsWith(`${group.key}/`))
  const plugin = group?.clients.find((plugin) => `${plugin.target}/${plugin.client}` === id)
  if (!plugin) {
    return Promise.resolve(undefined)
  }
  const cached = pending.get(id)
  if (cached) {
    return cached
  }
  const request = plugin.load().catch((error: unknown) => {
    pending.delete(id)
    throw error
  })
  pending.set(id, request)
  return request
}
