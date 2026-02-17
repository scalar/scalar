declare module 'postman-sandbox' {
  export type SandboxContext = {
    on: (event: string, listener: (...args: any[]) => void) => void
    off: (event: string, listener: (...args: any[]) => void) => void
    execute: (target: unknown, options: unknown, callback: (error: unknown) => void) => void
    dispose: (callback?: () => void) => void
  }

  const sandbox: {
    createContext: (callback: (error: unknown, context: SandboxContext) => void) => void
  }

  export default sandbox
}
