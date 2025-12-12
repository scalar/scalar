/**
 * Use 'strong quoting' using single quotes so that we only need to deal with nested single quote characters.
 * see: http://wiki.bash-hackers.org/syntax/quoting#strong_quoting
 */
export const shellQuote = (value = ''): string => {
  const safe = /^[a-z0-9-_/.@%^=:]+$/i
  const isShellSafe = safe.test(value)
  if (isShellSafe) {
    return value
  }
  // if the value is not shell safe, then quote it
  return `'${value.replace(/'/g, "'\\''")}'`
}
export const shellEscape = (value: string): string => value.replace(/\r/g, '\\r').replace(/\n/g, '\\n')
