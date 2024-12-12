import type { CodeBuilderOptions } from '../helpers/code-builder.js'
import type { Request } from '../httpsnippet.js'

export type TargetId = keyof typeof targets
export type ClientId = string
export type ClientInfo = {
  key: ClientId
  title: string
  link: string
  description: string
}
type SimpleMerge<Destination, Source> = {
  [Key in keyof Destination as Key extends keyof Source
    ? never
    : Key]: Destination[Key]
} & Source
export type Converter<T extends Record<string, any>> = (
  request: Request,
  options?: SimpleMerge<CodeBuilderOptions, T>,
) => string
export type Client<T extends Record<string, any> = Record<string, any>> = {
  info: ClientInfo
  convert: Converter<T>
}
export type Extension = `.${string}` | null
export type TargetInfo = {
  key: TargetId
  title: string
  extname: Extension
  default: string
}
export type Target = {
  info: TargetInfo
  clientsById: Record<ClientId, Client>
}
export declare const targets: {
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
export declare const isTarget: (target: Target) => target is Target
export declare function isValidTargetId(value: string): value is TargetId
export declare const addTarget: (target: Target) => void
export declare const isClient: (
  client: Client,
) => client is Client<Record<string, any>>
export declare const addTargetClient: (
  targetId: TargetId,
  client: Client,
) => void
export {}
