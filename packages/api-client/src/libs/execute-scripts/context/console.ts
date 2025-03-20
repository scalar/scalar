export interface ConsoleContext {
  log: (...args: any[]) => void
  error: (...args: any[]) => void
  warn: (...args: any[]) => void
  info: (...args: any[]) => void
  debug: (...args: any[]) => void
  trace: (...args: any[]) => void
  table: (tabularData: any, properties?: readonly string[]) => void
}

export const createConsoleContext = (): ConsoleContext => ({
  log: (...args: any[]) => console.log('[Script]', ...args),
  error: (...args: any[]) => console.error('[Script Error]', ...args),
  warn: (...args: any[]) => console.warn('[Script Warning]', ...args),
  info: (...args: any[]) => console.info('[Script Info]', ...args),
  debug: (...args: any[]) => console.debug('[Script Debug]', ...args),
  trace: (...args: any[]) => console.trace('[Script Trace]', ...args),
  table: (tabularData: any, properties?: readonly string[]) => console.table(tabularData, properties),
})
