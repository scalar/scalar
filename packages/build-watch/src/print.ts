export const ansiColors = {
  black: 30,
  red: 31,
  green: 32,
  yellow: 33,
  blue: 34,
  magenta: 35,
  cyan: 36,
  white: 37,
  gray: 90,
  brightRed: 91,
  brightGreen: 92,
  brightYellow: 93,
  brightBlue: 94,
  brightMagenta: 95,
  brightCyan: 96,
  brightWhite: 97,
}

export type Color = keyof typeof ansiColors

export function prefixStream(prefix: string) {
  return (chunk: string | Buffer) => {
    const c = typeof chunk === 'object' ? chunk.toString('utf-8') : chunk
    console.log(
      c
        .split('\n')
        .map((t: string) => `[${prefix}]: ${t}`)
        .join('\n'),
    )
  }
}

/** Log to the console with a specific color */
export function printColor(color: Color, message: any) {
  const formatted =
    typeof message === 'string' ? message : JSON.stringify(message, null, 2)
  console.log(`\x1b[${ansiColors[color]}m${formatted}\x1b[0m`)
}

export function printHeader(color: Color, message: string) {
  printColor(
    color,
    '-------------------------------------------------------------------',
  )
  printColor(color, message)
  printColor(
    color,
    '-------------------------------------------------------------------',
  )
}
