/**
 * Checks if the user is in an Electron environment
 *
 * @returns true if the user is in an Electron environment, false otherwise
 */
export const isElectron = (): boolean => typeof window !== 'undefined' && 'electron' in window
