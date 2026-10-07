import { describe, expect, it } from 'vitest'

import { type CliContext, anchor, groupIntoPages, renderCommand, renderIndex, renderPage } from './generate-cli-docs'

type Command = CliContext['commands'][number]

const help = { flags: '-h, --help', description: 'display help for command', mandatory: false }

const command = (overrides: Partial<Command> & Pick<Command, 'name' | 'command'>): Command => ({
  usage: `${overrides.command} [options]`,
  description: `Run ${overrides.name}`,
  runnable: true,
  arguments: [],
  options: [help],
  commands: [],
  ...overrides,
})

const group = (name: string, children: string[]): Command =>
  command({
    name,
    command: `scalar ${name}`,
    description: `Manage ${name}`,
    runnable: false,
    commands: children.map((child) => command({ name: child, command: `scalar ${name} ${child}` })),
  })

const context: CliContext = {
  version: '1.2.3',
  commands: [
    command({ name: 'upgrade', command: 'scalar upgrade' }),
    group('team', ['list', 'set']),
    group('document', ['bundle', 'lint']),
    command({ name: 'help', command: 'scalar help' }),
    group('mystery', ['one', 'two']),
  ],
}

describe('groupIntoPages', () => {
  it('orders known groups first, keeps unknown groups, and ends with the general page', () => {
    expect(groupIntoPages(context).map((page) => page.slug)).toEqual(['document', 'team', 'mystery', 'general'])
  })

  it('collects small top-level commands on the general page and skips help', () => {
    const general = groupIntoPages(context).at(-1)

    expect(general?.commands.map((entry) => entry.command)).toEqual(['scalar upgrade'])
  })

  it('flattens nested groups into runnable commands', () => {
    const domain = {
      ...group('domain', []),
      command: 'scalar access-group domain',
      commands: [command({ name: 'add', command: 'scalar access-group domain add' })],
    }
    const accessGroup = {
      ...group('access-group', []),
      commands: [command({ name: 'list', command: 'scalar access-group list' }), domain],
    }

    const pages = groupIntoPages({ version: '1.2.3', commands: [accessGroup] })

    expect(pages[0]?.commands.map((entry) => entry.command)).toEqual([
      'scalar access-group list',
      'scalar access-group domain add',
    ])
  })
})

describe('anchor', () => {
  it('matches heading slugs for nested commands', () => {
    expect(anchor('domain add')).toBe('domain-add')
  })
})

describe('renderCommand', () => {
  const [page] = groupIntoPages(context)
  if (!page) {
    throw new Error('Expected a document page')
  }

  it('drops the help option and the default column when nothing has a default', () => {
    const lines = renderCommand(
      command({
        name: 'bundle',
        command: 'scalar document bundle',
        options: [help, { flags: '-o, --output <file>', description: 'Output file', mandatory: false }],
      }),
      page,
    )

    expect(lines).toContain('| Option | Description |')
    expect(lines.join('\n')).not.toContain('--help')
  })

  it('folds required, choices, environment, and defaults into the table', () => {
    const lines = renderCommand(
      command({
        name: 'lint',
        command: 'scalar document lint',
        arguments: [{ name: 'file|url', description: 'Path or URL', required: true, variadic: false }],
        options: [
          {
            flags: '--format <format>',
            description: 'Report format',
            mandatory: false,
            default: 'text',
            choices: ['text', 'json'],
            env: 'SCALAR_FORMAT',
          },
          { flags: '--no-open', description: 'Do not open the browser', mandatory: false, default: true },
        ],
      }),
      page,
    )

    expect(lines).toContain('| `file\\|url` | **Required.** Path or URL. |')
    expect(lines).toContain(
      '| `--format <format>` | Report format. One of `text`, `json`. Falls back to `SCALAR_FORMAT`. | `text` |',
    )
    expect(lines).toContain('| `--no-open` | Do not open the browser. |  |')
  })
})

describe('renderPage', () => {
  it('links the summary table to each command heading', () => {
    const [page] = groupIntoPages(context)
    if (!page) {
      throw new Error('Expected a document page')
    }

    const markdown = renderPage(page, '1.2.3')

    expect(markdown).toContain('# scalar document')
    expect(markdown).toContain('| [`scalar document bundle`](#bundle) | Run bundle |')
    expect(markdown).toContain('## bundle')
  })
})

describe('renderIndex', () => {
  it('links every command to its page and anchor', () => {
    const markdown = renderIndex(groupIntoPages(context), '1.2.3')

    expect(markdown).toContain('## [scalar team](commands/team.md)')
    expect(markdown).toContain('- [`scalar team set`](commands/team.md#set): Run set')
    expect(markdown).toContain('- [`scalar upgrade`](commands/general.md#upgrade): Run upgrade')
  })
})
