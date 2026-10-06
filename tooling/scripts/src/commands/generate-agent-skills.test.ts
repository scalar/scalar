import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { generateAgentSkillFiles } from './generate-agent-skills'

const mockServer = '---\nname: mock-server\ndescription: "Mock APIs: seeded responses."\n---\n\n# Mock server\n'
const docs = '---\nname: scalar-docs\ndescription: Configure Scalar Docs.\n---\n\n# Docs\n'

let root: string

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'scalar-agent-skills-'))
  for (const { name, content } of [
    { name: 'mock-server', content: mockServer },
    { name: 'scalar-docs', content: docs },
  ]) {
    const directory = join(root, '.agents/skills', name)
    await mkdir(directory, { recursive: true })
    await writeFile(join(directory, 'SKILL.md'), content)
  }
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('generate-agent-skills', () => {
  it('publishes only product skills with matching names and hashes of served bytes', async () => {
    await mkdir(join(root, '.agents/skills/typescript'), { recursive: true })
    await writeFile(join(root, '.agents/skills/typescript/SKILL.md'), 'A contributor skill')
    await generateAgentSkillFiles(root)
    const destination = join(root, 'documentation/assets/.well-known/agent-skills')
    const publishedMock = mockServer.replace('name: mock-server', 'name: scalar-mock-server')
    expect(await readFile(join(destination, 'scalar-mock-server/SKILL.md'), 'utf8')).toBe(publishedMock)
    expect(await readFile(join(destination, 'scalar-docs/SKILL.md'), 'utf8')).toBe(docs)
    expect(JSON.parse(await readFile(join(destination, 'index.json'), 'utf8'))).toStrictEqual({
      $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
      skills: [
        {
          name: 'scalar-mock-server',
          type: 'skill-md',
          description: 'Mock APIs: seeded responses.',
          url: '/.well-known/agent-skills/scalar-mock-server/SKILL.md',
          digest: `sha256:${createHash('sha256').update(publishedMock).digest('hex')}`,
        },
        {
          name: 'scalar-docs',
          type: 'skill-md',
          description: 'Configure Scalar Docs.',
          url: '/.well-known/agent-skills/scalar-docs/SKILL.md',
          digest: `sha256:${createHash('sha256').update(docs).digest('hex')}`,
        },
      ],
    })
    expect(await readFile(join(root, '.agents/skills/mock-server/SKILL.md'), 'utf8')).toBe(mockServer)
    await expect(generateAgentSkillFiles(root, true)).resolves.toBeUndefined()
  })

  it('detects source changes without writing in check mode', async () => {
    await generateAgentSkillFiles(root)
    const indexPath = join(root, 'documentation/assets/.well-known/agent-skills/index.json')
    const originalIndex = await readFile(indexPath, 'utf8')
    await writeFile(join(root, '.agents/skills/scalar-docs/SKILL.md'), `${docs}Updated instructions\n`)
    await expect(generateAgentSkillFiles(root, true)).rejects.toThrow('Run pnpm script generate-agent-skills')
    expect(await readFile(indexPath, 'utf8')).toBe(originalIndex)
    await generateAgentSkillFiles(root)
    await expect(generateAgentSkillFiles(root, true)).resolves.toBeUndefined()
  })

  it('rejects missing artifacts and stale index digests', async () => {
    await expect(generateAgentSkillFiles(root, true)).rejects.toThrow('Stale or missing')
    await generateAgentSkillFiles(root)
    await writeFile(join(root, 'documentation/assets/.well-known/agent-skills/index.json'), '{}\n')
    await expect(generateAgentSkillFiles(root, true)).rejects.toThrow('index.json')
  })

  it('rejects invalid source metadata before writing any artifacts', async () => {
    await writeFile(join(root, '.agents/skills/scalar-docs/SKILL.md'), 'Missing frontmatter')
    await expect(generateAgentSkillFiles(root)).rejects.toThrow('Missing frontmatter in scalar-docs/SKILL.md')
    await expect(readFile(join(root, 'documentation/assets/.well-known/agent-skills/index.json'))).rejects.toThrow()
  })
})
