import { relative, resolve } from 'node:path'

/**
 * Resolve paths against the directory the user invoked the command from.
 */
export const resolveUserPath = (input: string, cwd = process.env.INIT_CWD ?? process.cwd()): string => {
  return resolve(cwd, input)
}

export const normalizeRelativePath = (input: string): string => {
  return input.replace(/^\.\/+/, '').replace(/\\/g, '/')
}

export const toWorkspaceRelativePath = (input: string, cwd = process.env.INIT_CWD ?? process.cwd()): string => {
  return relative(cwd, resolve(cwd, input)).replace(/\\/g, '/')
}
