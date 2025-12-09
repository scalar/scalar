import type { CodeBuilderOptions } from '@/httpsnippet-lite/helpers/code-builder'
import type { SnippetRequest } from '@/httpsnippet-lite/helpers/snippet-request'

type Target = {
  info: TargetInfo
  clientsById: Record<ClientId, Client>
}
interface Targets {
  c: Target
  clojure: Target
  csharp: Target
  go: Target
  http: Target
  java: Target
  javascript: Target
  kotlin: Target
  node: Target
  objc: Target
  ocaml: Target
  php: Target
  powershell: Target
  python: Target
  r: Target
  ruby: Target
  shell: Target
  swift: Target
}
type TargetId = keyof Targets

type ClientId = string
type ClientInfo = {
  key: ClientId
  title: string
  link: string
  description: string
}

type SimpleMerge<Destination, Source> = {
  [Key in keyof Destination as Key extends keyof Source ? never : Key]: Destination[Key]
} & Source

export type Converter<T extends Record<string, any>> = (
  request: SnippetRequest,
  options?: SimpleMerge<CodeBuilderOptions, T>,
) => string

export type Client<T extends Record<string, any> = Record<string, any>> = {
  info: ClientInfo
  convert: Converter<T>
}
type Extension = `.${string}` | null
type TargetInfo = {
  key: TargetId
  title: string
  extname: Extension
  default: string
}
