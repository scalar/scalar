declare module '@scalar/use-toasts' {
  export const useToasts: () => {
    toast: (
      message: string,
      type: 'error' | 'warn' | 'info',
      options?: { timeout: number },
    ) => void
  }
}
