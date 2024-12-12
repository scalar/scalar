export type PostmanCollection = {
  info: Info
  item: (Item | ItemGroup)[]
  event?: Event[]
  variable?: Variable[]
  auth?: Auth | null
  protocolProfileBehavior?: ProtocolProfileBehavior
}

export type Info = {
  name: string
  _postman_id?: string
  description?: Description
  version?: Version
  schema: string
}

export type Description =
  | string
  | {
      content?: string
      type?: string
      version?: string | number
    }

export type Version =
  | string
  | {
      major: number
      minor: number
      patch: number
      identifier?: string
      meta?: Record<string, string | number | boolean>
    }

export type Item = {
  id?: string
  name?: string
  description?: Description
  variable?: Variable[]
  event?: Event[]
  request: Request
  response?: Response[]
  protocolProfileBehavior?: ProtocolProfileBehavior
  variables?: Variable[]
}

export type ItemGroup = {
  name?: string
  description?: Description
  variable?: Variable[]
  item: (Item | ItemGroup)[]
  event?: Event[]
  auth?: Auth | null
  protocolProfileBehavior?: ProtocolProfileBehavior
  variables?: Variable[]
}

export type Event = {
  id?: string
  listen: string
  script: Script
  disabled?: boolean
}

export type Script = {
  id?: string
  type?: string
  exec?: string[] | string
  src?: Url
  name?: string
}

export type Url =
  | string
  | {
      raw?: string
      protocol?: string
      host?: string | string[]
      path?: string | (string | { type: string; value: string })[]
      port?: string
      query?: QueryParam[]
      hash?: string
      variable?: Variable[]
    }

export type QueryParam = {
  key: string | null
  value: string | null
  disabled?: boolean
  description?: Description
}

export type Variable = {
  key: string
  value: string | number | boolean
  type?: 'string' | 'number' | 'boolean' | 'environment'
  enum?: string[]
  description?: string
}

export type Auth = {
  type: string
  noauth?: null
  apikey?: AuthAttribute[]
  awsv4?: AuthAttribute[]
  basic?: AuthAttribute[]
  bearer?: AuthAttribute[]
  digest?: AuthAttribute[]
  edgegrid?: AuthAttribute[]
  hawk?: AuthAttribute[]
  ntlm?: AuthAttribute[]
  oauth1?: AuthAttribute[]
  oauth2?: AuthAttribute[]
}

export type AuthAttribute = {
  key: string
  value?: string | number | boolean
  type?: string
}

export type Request =
  | string
  | {
      url?: Url
      auth?: Auth | null
      proxy?: ProxyConfig
      certificate?: Certificate
      method?: string
      description?: Description
      header?: HeaderList | string
      body?: RequestBody | null
    }

export type ProxyConfig = {
  match?: string
  host?: string
  port?: number
  tunnel?: boolean
  disabled?: boolean
}

export type Certificate = {
  name?: string
  matches?: string[]
  key?: { src?: string }
  cert?: { src?: string }
  passphrase?: string
}

export type HeaderList = Header[]

export type Header = {
  key: string
  value: string
  disabled?: boolean
  description?: Description
}

export type RequestBody = {
  mode?: 'raw' | 'urlencoded' | 'formdata' | 'file' | 'graphql'
  raw?: string
  graphql?: {
    query?: string
    variables?: Record<string, string | number | boolean | null>
  }
  urlencoded?: UrlEncodedParameter[]
  formdata?: FormParameter[]
  file?: { src?: string | null; content?: string }
  options?: {
    raw?: { language?: string }
    urlencoded?: { contentType?: string }
    formdata?: { contentType?: string }
  }
  disabled?: boolean
}

export type UrlEncodedParameter = {
  key: string
  value?: string
  disabled?: boolean
  description?: Description
}

export type FormParameter =
  | {
      key: string
      value?: string
      disabled?: boolean
      type: 'text'
      contentType?: string
      description?: Description
    }
  | {
      key: string
      src?: string[] | string | null
      disabled?: boolean
      type: 'file'
      contentType?: string
      description?: Description
    }

export type Response = {
  id?: string
  originalRequest?: Request
  responseTime?: string | number | null
  timings?: object | null
  header?: HeaderList | string | null
  cookie?: Cookie[]
  body?: string | null
  status?: string
  code?: number
}

export type Cookie = {
  domain: string
  expires?: string | null
  maxAge?: string
  hostOnly?: boolean
  httpOnly?: boolean
  name?: string
  path: string
  secure?: boolean
  session?: boolean
  value?: string
  extensions?: Array<{
    key: string
    value: string
  }>
}

export type ParsedUrl = {
  protocol: string
  hostname: string
  port: string
}

export type TableCell = {
  [key: string]: string
}

export type TableObject = {
  [key: string]: TableCell
}

export type ProtocolProfileBehavior = {
  // This is left as an empty object as per the schema
}
