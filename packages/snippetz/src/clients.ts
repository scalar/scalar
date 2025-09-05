import { cLibcurl } from '@/plugins/c/libcurl/libcurl'
import { clojureCljhttp } from '@/plugins/clojure/clj_http'
import { csharpHttpclient } from '@/plugins/csharp/httpclient'
import { csharpRestsharp } from '@/plugins/csharp/restsharp'
import { dartHttp } from '@/plugins/dart/http'
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
import { pythonHttpxSync, pythonHttpxAsync } from '@/plugins/python/httpx'
import { rHttr } from '@/plugins/r/httr'
import { rubyNative } from '@/plugins/ruby/native'
import { rustReqwest } from '@/plugins/rust/reqwest'
import { shellCurl } from '@/plugins/shell/curl'
import { shellHttpie } from '@/plugins/shell/httpie'
import { shellWget } from '@/plugins/shell/wget'
import { swiftNsurlsession } from '@/plugins/swift/nsurlsession'
import type { Target } from '@scalar/types/snippetz'

/**
 * All available clients
 */
export const clients: Target[] = [
  {
    key: 'c',
    title: 'C',
    default: 'libcurl',
    clients: [cLibcurl],
  },
  {
    key: 'csharp',
    title: 'C#',
    default: 'restsharp',
    clients: [csharpHttpclient, csharpRestsharp],
  },
  {
    key: 'clojure',
    title: 'Clojure',
    default: 'clj_http',
    clients: [clojureCljhttp],
  },
  {
    key: 'dart',
    title: 'Dart',
    default: 'http',
    clients: [dartHttp],
  },
  {
    key: 'go',
    title: 'Go',
    default: 'native',
    clients: [goNative],
  },
  {
    key: 'http',
    title: 'HTTP',
    default: 'http1.1',
    clients: [httpHttp11],
  },
  {
    key: 'java',
    title: 'Java',
    default: 'unirest',
    clients: [javaAsynchttp, javaNethttp, javaOkhttp, javaUnirest],
  },
  {
    key: 'js',
    title: 'JavaScript',
    default: 'fetch',
    clients: [jsFetch, jsAxios, jsOfetch, jsJquery, jsXhr],
  },
  {
    key: 'kotlin',
    title: 'Kotlin',
    default: 'okhttp',
    clients: [kotlinOkhttp],
  },
  {
    key: 'node',
    title: 'Node.js',
    default: 'fetch',
    clients: [nodeFetch, nodeAxios, nodeOfetch, nodeUndici],
  },
  {
    key: 'objc',
    title: 'Objective-C',
    default: 'nsurlsession',
    clients: [objcNsurlsession],
  },
  {
    key: 'ocaml',
    title: 'OCaml',
    default: 'cohttp',
    clients: [ocamlCohttp],
  },
  {
    key: 'php',
    title: 'PHP',
    default: 'curl',
    clients: [phpCurl, phpGuzzle],
  },
  {
    key: 'powershell',
    title: 'PowerShell',
    default: 'webrequest',
    clients: [powershellWebrequest, powershellRestmethod],
  },
  {
    key: 'python',
    title: 'Python',
    default: 'python3',
    clients: [pythonPython3, pythonRequests, pythonHttpxSync, pythonHttpxAsync],
  },
  {
    key: 'r',
    title: 'R',
    default: 'httr',
    clients: [rHttr],
  },
  {
    key: 'ruby',
    title: 'Ruby',
    default: 'native',
    clients: [rubyNative],
  },
  {
    key: 'rust',
    title: 'Rust',
    default: 'reqwest',
    clients: [rustReqwest],
  },
  {
    key: 'shell',
    title: 'Shell',
    default: 'curl',
    clients: [shellCurl, shellWget, shellHttpie],
  },
  {
    key: 'swift',
    title: 'Swift',
    default: 'nsurlsession',
    clients: [swiftNsurlsession],
  },
]
