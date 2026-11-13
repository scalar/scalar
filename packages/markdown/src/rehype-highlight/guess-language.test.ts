import { describe, expect, it } from 'vitest'

import { guessLanguage } from './guess-language'

describe('guess-language', () => {
  it('guesses JSON objects and arrays that parse', () => {
    expect(guessLanguage('{"id": 1, "name": "Mars", "habitable": false}')).toBe('json')
    expect(guessLanguage('\n  [\n    {"id": 1},\n    {"id": 2}\n  ]\n')).toBe('json')
  })

  it('does not guess JSON that does not parse', () => {
    expect(guessLanguage('{ id: 1 }')).toBeUndefined()
    expect(guessLanguage('{"id": 1,}')).toBeUndefined()
    expect(guessLanguage('[1, 2')).toBeUndefined()
    expect(guessLanguage('{{$randomEmail}}')).toBeUndefined()
  })

  it('guesses curl commands, with or without a prompt', () => {
    expect(guessLanguage('curl https://api.example.com/planets')).toBe('curl')
    expect(
      guessLanguage('$ curl -X POST https://api.example.com/planets \\\n  -H "Content-Type: application/json"'),
    ).toBe('curl')
  })

  it('does not guess other shell commands', () => {
    expect(guessLanguage('npm -g install @scalar/cli')).toBeUndefined()
    expect(guessLanguage('$ yarn start')).toBeUndefined()
    expect(guessLanguage('dotnet add package Scalar.AspNetCore')).toBeUndefined()
    expect(guessLanguage('curly braces are fine')).toBeUndefined()
  })

  it('guesses markup that opens and closes like markup', () => {
    expect(guessLanguage('<!doctype html>\n<html>\n  <body></body>\n</html>')).toBe('html')
    expect(guessLanguage('<?xml version="1.0"?>\n<planet id="1"></planet>')).toBe('html')
    expect(guessLanguage('<div class="x">Hi</div>')).toBe('html')
    expect(guessLanguage('<img src="planet.png" alt="Mars" />')).toBe('html')
    expect(guessLanguage('<svg xmlns="http://www.w3.org/2000/svg"><circle r="4" /></svg>')).toBe('html')
  })

  it('does not guess text that only looks like it opens a tag', () => {
    expect(guessLanguage('<T>(value: T): Array<T>')).toBeUndefined()
    expect(guessLanguage('<your-api-key>')).toBeUndefined()
    expect(guessLanguage('<div>unclosed')).toBeUndefined()
    expect(guessLanguage('a < b && c > d')).toBeUndefined()
  })

  it('does not guess the blocks highlight.js used to get wrong', () => {
    expect(guessLanguage('var builder = WebApplication.CreateBuilder();\nvar app = builder.Build();')).toBeUndefined()
    expect(guessLanguage('/src\n  /lib\n    custom-lib.ts')).toBeUndefined()
    expect(guessLanguage('0 9 * * * cd /path/to/job && npx tsx sweep.ts')).toBeUndefined()
    expect(
      guessLanguage('POST /subscribe\nHost: my.example.com\n\n{"callbackUrl": "https://example.com"}'),
    ).toBeUndefined()
    expect(guessLanguage('tell application "Foo"\n    beep\nend tell')).toBeUndefined()
  })

  it('does not guess empty or whitespace-only code', () => {
    expect(guessLanguage('')).toBeUndefined()
    expect(guessLanguage('  \n\t')).toBeUndefined()
  })
})
