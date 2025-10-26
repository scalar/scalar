import type { ResponseInstance } from '@scalar/oas-utils/entities/spec'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import type { Component } from 'vue'

export type ClientPlugin = {
  hooks?: Partial<{
    beforeRequest: (request: Request) => Request | Promise<Request>
    responseReceived: (response: Response, operation: Record<string, any>) => void | Promise<void>
  }>
  components?: Partial<{
    request: Component<{ operation: OperationObject; selectedExample?: string }>
    response: Component<{ request?: Request; response?: ResponseInstance }>
  }>
}
