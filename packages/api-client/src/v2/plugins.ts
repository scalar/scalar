import type { ResponseInstance } from '@scalar/oas-utils/entities/spec'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import type { Component } from 'vue'
/**
 * ClientPlugin is used to extend the API Client with custom hooks and UI components.
 *
 * Example usage:
 *
 * const myPlugin: ClientPlugin = {
 *   hooks: {
 *     beforeRequest: (request) => {
 *       // Modify the request before it is sent
 *       request.headers.set('X-Custom-Header', 'foo');
 *       return request;
 *     },
 *     responseReceived: async (response, operation) => {
 *       // Handle post-response logic
 *       const data = await response.json();
 *       console.log('Received:', data, 'for operation:', operation.operationId);
 *     }
 *   },
 *   components: {
 *     request: MyRequestComponent, // Custom Vue component for rendering the request section
 *     response: MyResponseComponent // Custom Vue component for rendering the response section
 *   }
 * }
 */
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
