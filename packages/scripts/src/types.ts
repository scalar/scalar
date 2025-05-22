export type SynchronousResponse = Omit<Response, 'body' | 'text' | 'json' | 'clone'> & {
  body: string | null
  text: () => string
  json: () => Record<string, any> | Array<any>
  clone: () => SynchronousResponse
}
