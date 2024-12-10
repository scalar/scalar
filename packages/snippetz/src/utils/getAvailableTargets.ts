// TODO: Integrate this into the core, replace snippetz.targets()
import type { Target } from '@/types'

const targets: Target[] = [
  {
    key: 'c',
    title: 'C',
    default: 'libcurl',
    clients: ['libcurl'],
  },
  {
    key: 'csharp',
    title: 'C#',
    default: 'restsharp',
    clients: ['httpclient', 'restsharp'],
  },
  {
    key: 'clojure',
    title: 'Clojure',
    default: 'clj_http',
    clients: ['clj_http'],
  },
  {
    key: 'go',
    title: 'Go',
    default: 'native',
    clients: ['native'],
  },
  {
    key: 'http',
    title: 'HTTP',
    default: 'http1.1',
    clients: ['http1.1'],
  },
  {
    key: 'java',
    title: 'Java',
    default: 'unirest',
    clients: ['asynchttp', 'nethttp', 'okhttp', 'unirest'],
  },
  {
    key: 'js',
    title: 'JavaScript',
    default: 'fetch',
    clients: ['fetch', 'axios', 'ofetch', 'jquery', 'xhr'],
  },
  {
    key: 'kotlin',
    title: 'Kotlin',
    default: 'okhttp',
    clients: ['okhttp'],
  },
  {
    key: 'node',
    title: 'Node.js',
    default: 'fetch',
    clients: ['fetch', 'axios', 'ofetch', 'undici'],
  },
  {
    key: 'objc',
    title: 'Objective-C',
    default: 'nsurlsession',
    clients: ['nsurlsession'],
  },
  {
    key: 'ocaml',
    title: 'OCaml',
    default: 'cohttp',
    clients: ['cohttp'],
  },
  {
    key: 'php',
    title: 'PHP',
    default: 'curl',
    clients: ['curl', 'guzzle'],
  },
  {
    key: 'powershell',
    title: 'Powershell',
    default: 'webrequest',
    clients: ['webrequest', 'restmethod'],
  },
  {
    key: 'python',
    title: 'Python',
    default: 'python3',
    clients: ['python3', 'requests'],
  },
  {
    key: 'r',
    title: 'R',
    default: 'httr',
    clients: ['httr'],
  },
  {
    key: 'ruby',
    title: 'Ruby',
    default: 'native',
    clients: ['native'],
  },
  {
    key: 'shell',
    title: 'Shell',
    default: 'curl',
    clients: ['curl', 'httpie', 'wget'],
  },
  {
    key: 'swift',
    title: 'Swift',
    default: 'nsurlsession',
    clients: ['nsurlsession'],
  },
]

/**
 * Get all available targets with their clients
 */
export function getAvailableTargets() {
  return targets
}
