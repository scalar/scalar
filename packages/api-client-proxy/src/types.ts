export enum ProxyHeader {
  // Should all be lowercase or they won't match
  StatusCode = 'x-scalar-api-client-response-status-code',
  StatusText = 'x-scalar-api-client-response-status-text',
}
