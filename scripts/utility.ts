/** A list of colors that can be used in the console */
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
} as const

/** Log to the console with a specific color */
export function printColor(color: keyof typeof ansiColors, message: string) {
  if (!ansiColors[color]) {
    return console.log(message)
  }

  console.log(`\x1b[${ansiColors[color]}m${message}\x1b[0m`)
}
