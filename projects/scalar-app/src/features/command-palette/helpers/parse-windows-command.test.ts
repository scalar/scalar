import { describe, expect, it } from 'vitest'

import { isWindowsCommand, parseWindowsCommand } from './parse-windows-command'

describe('parse-windows-command', () => {
  it.each([
    ['a quoted argument', 'curl --url ^"https://example.com^"'],
    ['joined lines', 'curl https://example.com ^\n  -H "Accept: */*"'],
    ['joined lines with a carriage return', 'curl https://example.com ^\r\n  -H "Accept: */*"'],
    ['a quoted argument after a POSIX quote', `curl -H 'Accept: */*' --url ^"https://example.com^"`],
    ['a caret after a closed double quote', 'curl -d "a" ^"b^"'],
  ])('detects %s', (_name, command) => {
    expect(isWindowsCommand(command)).toBe(true)
  })

  it.each([
    ['a caret in single quotes', `curl -d 'a^b' https://example.com`],
    ['a caret and a quote in single quotes', `curl -d 'a^"b' https://example.com`],
    ['a caret and a line break in single quotes', `curl -d 'a^\nb' https://example.com`],
    ['a caret and a quote in double quotes', 'curl -d "a^\\"b" https://example.com'],
    ['a caret and a quote in ANSI-C quotes', `curl -d $'a^\\'b^"' https://example.com`],
    ['an escaped caret', 'curl -d a\\^"b" https://example.com'],
    ['a caret that does not escape a quote or a line break', 'curl -d a^b https://example.com'],
    ['a caret at the end', 'curl https://example.com ^'],
    ['a command without a caret', `curl -X POST -d '{"name":"Ada"}' https://example.com`],
    ['an empty command', ''],
  ])('does not detect %s', (_name, command) => {
    expect(isWindowsCommand(command)).toBe(false)
  })
  it.each([
    [
      'carets before special characters',
      'a ^& b ^| c ^< d ^> e ^^ f',
      ['a', '&', 'b', '|', 'c', '<', 'd', '>', 'e', '^', 'f'],
    ],
    ['carets in a quoted argument', 'curl "a^b" c', ['curl', 'a^b', 'c']],
    ['a caret before a quote', '^"a b^" c', ['a b', 'c']],
    ['joined lines', 'curl ^\n  -H ^"a^"', ['curl', '-H', 'a']],
    ['joined lines with a carriage return', 'curl ^\r\n  -H ^"a^"', ['curl', '-H', 'a']],
    ['a line break kept in a quoted argument', '^"a^\n\nb^"', ['a\nb']],
    ['an empty quoted argument', 'a ^"^" b', ['a', '', 'b']],
    ['a doubled quote in a quoted argument', '^"a^"^"b^"', ['a"b']],
    ['a quoted argument that starts and ends with a quote', '^"^"^"a^"^"^"', ['"a"']],
    ['an escaped quote', '^"a^\\^"b^"', ['a"b']],
    ['doubled backslashes', '^"a^\\^\\b^"', ['a\\b']],
    ['a backslash before another character', '^"a^\\b^"', ['a\\b']],
    ['a backslash before the closing quote', '^"a^\\^\\^" b', ['a\\', 'b']],
    ['separators in a quoted argument', '^"a  b\tc^"', ['a  b\tc']],
    ['a tab between arguments', 'a\tb', ['a', 'b']],
    ['multilingual text that is kept as it is', '^"café 日本語 😀 שלום^"', ['café 日本語 😀 שלום']],
    ['multilingual text after carets', '^"caf^é ^日^本^語 ^😀 ^ש^ל^ו^ם^"', ['café 日本語 😀 שלום']],
    ['an unterminated quote', '^"a b', ['a b']],
    ['a trailing caret', 'a ^', ['a']],
    ['an empty command', '', []],
  ])('reads %s', (_name, command, args) => {
    expect(parseWindowsCommand(command)).toStrictEqual(args)
  })
})
