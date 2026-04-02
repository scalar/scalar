#!/usr/bin/env node
import { writeFile } from 'node:fs/promises'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

import { createMarkdownFromOpenApi } from './index.js'

type ParsedCliArguments = {
  input: string
  output?: string
}

const usage = `Usage: openapi-to-markdown <input> [output] [--output <file>]

Arguments:
  input             OpenAPI document path or URL
  output            Output path (optional, defaults to stdout)

Options:
  -o, --output      Write result to a file
  -h, --help        Show this help message`

export const parseCliArguments = (arguments_: string[]): ParsedCliArguments => {
  const positionalArguments: string[] = []
  let outputFromFlag: string | undefined

  for (let index = 0; index < arguments_.length; index++) {
    const argument = arguments_[index]

    if (!argument) {
      continue
    }

    if (argument === '-h' || argument === '--help') {
      throw new Error(usage)
    }

    if (argument === '--') {
      positionalArguments.push(...arguments_.slice(index + 1))
      break
    }

    if (argument === '-o' || argument === '--output') {
      const outputPath = arguments_[index + 1]

      if (!outputPath || outputPath.startsWith('-')) {
        throw new Error('Missing value for --output')
      }

      outputFromFlag = outputPath
      index++
      continue
    }

    if (argument.startsWith('--output=')) {
      const outputPath = argument.slice('--output='.length)

      if (!outputPath) {
        throw new Error('Missing value for --output')
      }

      outputFromFlag = outputPath
      continue
    }

    if (argument.startsWith('-')) {
      throw new Error(`Unknown option: ${argument}`)
    }

    positionalArguments.push(argument)
  }

  const [input, positionalOutput, ...remainingPositionalArguments] = positionalArguments

  if (!input) {
    throw new Error(`Missing input argument\n\n${usage}`)
  }

  if (remainingPositionalArguments.length > 0) {
    throw new Error(`Unexpected positional argument: ${remainingPositionalArguments[0]}`)
  }

  if (positionalOutput && outputFromFlag) {
    throw new Error('Use either positional output or --output, not both')
  }

  return {
    input,
    output: outputFromFlag ?? positionalOutput,
  }
}

export const runCli = async (arguments_: string[]): Promise<number> => {
  try {
    const { input, output } = parseCliArguments(arguments_)
    const markdown = await createMarkdownFromOpenApi(input)

    if (output) {
      await writeFile(output, markdown, 'utf8')
      return 0
    }

    process.stdout.write(markdown)
    return 0
  } catch (error) {
    if (error instanceof Error) {
      const isHelpOutput = error.message === usage
      const writer = isHelpOutput ? process.stdout : process.stderr
      writer.write(`${error.message}\n`)
      return isHelpOutput ? 0 : 1
    }

    process.stderr.write('Unknown CLI error\n')
    return 1
  }
}

const maybeMain = process.argv[1]
const isMainModule = maybeMain ? import.meta.url === pathToFileURL(maybeMain).href : false

if (isMainModule) {
  const exitCode = await runCli(process.argv.slice(2))

  if (exitCode !== 0) {
    process.exit(exitCode)
  }
}
