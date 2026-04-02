import { describe, expect, it } from 'vitest'

import { parseCliArguments } from './cli'

describe('cli', () => {
  it('parses input only', () => {
    expect(parseCliArguments(['openapi.yaml'])).toStrictEqual({
      input: 'openapi.yaml',
      output: undefined,
    })
  })

  it('parses positional output path', () => {
    expect(parseCliArguments(['openapi.yaml', 'llms.txt'])).toStrictEqual({
      input: 'openapi.yaml',
      output: 'llms.txt',
    })
  })

  it('parses --output flag', () => {
    expect(parseCliArguments(['openapi.yaml', '--output', 'llms.txt'])).toStrictEqual({
      input: 'openapi.yaml',
      output: 'llms.txt',
    })
  })

  it('parses --output= flag', () => {
    expect(parseCliArguments(['openapi.yaml', '--output=llms.txt'])).toStrictEqual({
      input: 'openapi.yaml',
      output: 'llms.txt',
    })
  })

  it('stops option parsing after --', () => {
    expect(parseCliArguments(['openapi.yaml', '--', '-not-an-option'])).toStrictEqual({
      input: 'openapi.yaml',
      output: '-not-an-option',
    })
  })

  it('throws when input is missing', () => {
    expect(() => parseCliArguments([])).toThrowError(/Missing input argument/)
  })

  it('throws for unknown options', () => {
    expect(() => parseCliArguments(['openapi.yaml', '--unknown'])).toThrowError('Unknown option: --unknown')
  })

  it('throws when --output value is missing', () => {
    expect(() => parseCliArguments(['openapi.yaml', '--output'])).toThrowError('Missing value for --output')
  })

  it('throws when output is provided twice', () => {
    expect(() => parseCliArguments(['openapi.yaml', 'a.txt', '--output', 'b.txt'])).toThrowError(
      'Use either positional output or --output, not both',
    )
  })

  it('throws for unexpected extra positional arguments', () => {
    expect(() => parseCliArguments(['openapi.yaml', 'a.txt', 'b.txt'])).toThrowError(
      'Unexpected positional argument: b.txt',
    )
  })
})
