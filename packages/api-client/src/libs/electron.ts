/**
 * Check if the current environment is Electron.
 */
export const isElectron = () => typeof window !== 'undefined' && 'electron' in window
