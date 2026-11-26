/** The characters that end an argument outside quotes, cmd.exe also ends a command at a line break. */
const ARGUMENT_SEPARATORS = new Set([' ', '\t', '\r', '\n'])

/** The line breaks a caret escapes, so the next line continues the command. */
const LINE_BREAKS = new Set(['\r\n', '\r', '\n'])

/** The characters after a caret that only cmd.exe output has, because the caret that escapes a quote or a line break is never needed in a POSIX shell. */
const CMD_CARET_TARGETS = new Set(['"', '\r', '\n'])

/** The characters a backslash escapes, Chrome and Firefox double every backslash and escape every quote of an argument. */
const COMMAND_LINE_ESCAPES = new Set(['\\', '"'])

/** The index after the POSIX quote that opens at the start index, so a caret inside a quoted body is never read as cmd.exe syntax. */
function skipPosixQuote(command: string, start: number): number {
  const isAnsiC = command.charAt(start) === '$'
  const quote = command.charAt(isAnsiC ? start + 1 : start)
  const hasEscapes = isAnsiC || quote === '"'
  let index = isAnsiC ? start + 2 : start + 1

  while (index < command.length && command.charAt(index) !== quote) {
    index += hasEscapes && command.charAt(index) === '\\' ? 2 : 1
  }

  return index + 1
}

/** Single quotes, double quotes and ANSI-C quotes open a quoted string in a POSIX shell. */
const startsPosixQuote = (command: string, index: number): boolean =>
  command.charAt(index) === "'" || command.charAt(index) === '"' || command.startsWith("$'", index)

/** Chrome and Firefox copy a cURL command for cmd.exe with every argument as ^"...^" and the lines joined by a caret, which no POSIX command has outside its quotes. */
export function isWindowsCommand(command: string): boolean {
  let index = 0

  while (index < command.length) {
    if (startsPosixQuote(command, index)) {
      index = skipPosixQuote(command, index)
    } else if (command.charAt(index) === '\\') {
      index += 2
    } else if (command.charAt(index) === '^' && CMD_CARET_TARGETS.has(command.charAt(index + 1))) {
      return true
    } else {
      index++
    }
  }

  return false
}

/** cmd.exe drops a caret outside double quotes and keeps the character after it, a caret before a line break removes the break, and this runs before the program reads its arguments. */
function removeCmdCarets(command: string): string {
  let result = ''
  let isQuoted = false

  for (let index = 0; index < command.length; index++) {
    const char = command.charAt(index)

    if (char === '^' && !isQuoted) {
      const escaped = command.startsWith('\r\n', index + 1) ? '\r\n' : command.charAt(index + 1)
      index += escaped.length
      result += LINE_BREAKS.has(escaped) ? '' : escaped
      continue
    }

    if (char === '"') {
      isQuoted = !isQuoted
    }
    result += char
  }

  return result
}

/** Split a Windows command line into arguments, a doubled quote inside quotes is one quote, and a backslash escapes a backslash or a quote so the doubling of the generators is undone. */
function splitCommandLine(commandLine: string): string[] {
  const args: string[] = []
  let current = ''
  let hasArgument = false
  let isQuoted = false

  for (let index = 0; index < commandLine.length; index++) {
    const char = commandLine.charAt(index)
    const next = commandLine.charAt(index + 1)

    if (!isQuoted && ARGUMENT_SEPARATORS.has(char)) {
      if (hasArgument) {
        args.push(current)
      }
      current = ''
      hasArgument = false
      continue
    }

    hasArgument = true

    if (char === '\\' && COMMAND_LINE_ESCAPES.has(next)) {
      current += next
      index++
    } else if (char === '"' && isQuoted && next === '"') {
      current += char
      index++
    } else if (char === '"') {
      isQuoted = !isQuoted
    } else {
      current += char
    }
  }

  return hasArgument ? [...args, current] : args
}

/** Parse a cURL command copied for cmd.exe into its arguments, as the shell and the program would read them. */
export const parseWindowsCommand = (command: string): string[] => splitCommandLine(removeCmdCarets(command))
