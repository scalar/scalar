import type { ZodSchema, ZodTypeDef } from 'zod'

export type APIResponse<T> = {
  status: number
  data: T
  error: false
}

export type APIError = {
  status: number
  message: string
  error: true
  originalError: any
}

export type RequestConfig<T> = Omit<RequestInit, 'body'> & {
  // why do we omit the body param?
  baseUrl?: string
  url: string
  accessToken?: string | (() => string) | Promise<string>
  schema: ZodSchema<T, ZodTypeDef, any>
  disableAuth?: boolean // Require explicit flag to disable auth
  headers?: Record<string, string>
  data?: Record<string, any> | FormData | null
  method: 'post' | 'get' | 'delete' | 'put' | 'patch'
}
