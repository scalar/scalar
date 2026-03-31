declare module 'postman-sandbox' {
  /** Execution result includes variable scopes; _variables holds script-set local vars. */
  export type ExecutionResult = {
    _variables?: { values?: Array<{ key: string; value: string; type?: string }> }
    globals?: { values?: Array<{ key: string; value: string; type?: string }> }
    collectionVariables?: { values?: Array<{ key: string; value: string; type?: string }> }
    environment?: { values?: Array<{ key: string; value: string; type?: string }> }
    data?: Record<string, string>
  }

  export type SandboxContext = {
    on: (event: string, listener: (...args: any[]) => void) => void
    off: (event: string, listener: (...args: any[]) => void) => void
    execute: (
      target: unknown,
      options: unknown,
      callback: (error: unknown, execution?: ExecutionResult) => void,
    ) => void
    dispose: (callback?: () => void) => void
  }

  const sandbox: {
    createContext: (callback: (error: unknown, context: SandboxContext) => void) => void
  }

  export default sandbox
}
