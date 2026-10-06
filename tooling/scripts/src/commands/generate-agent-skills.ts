import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { Command } from 'commander'
import { parse } from 'yaml'
import { z } from 'zod'

import { getWorkspaceRoot } from '../helpers'

const publishedSkills = [
  { source: 'mock-server', name: 'scalar-mock-server' },
  { source: 'scalar-docs', name: 'scalar-docs' },
]

const metadataSchema = z.object({
  name: z.string(),
  description: z.string().min(1).max(1024),
})

/** Publish the selected product skills and hash the exact bytes served by scalar.com. */
export const generateAgentSkillFiles = async (root: string, check = false): Promise<void> => {
  const destination = join(root, 'documentation/assets/.well-known/agent-skills')
  const artifacts = await Promise.all(
    publishedSkills.map(async ({ source, name }) => {
      const original = await readFile(join(root, '.agents/skills', source, 'SKILL.md'), 'utf8')
      const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(original)
      if (!frontmatter?.[1]) {
        throw new Error(`Missing frontmatter in ${source}/SKILL.md`)
      }
      const metadata = metadataSchema.parse(parse(frontmatter[1]))
      if (metadata.name !== source) {
        throw new Error(`Expected skill name ${source}, found ${metadata.name}`)
      }
      // Keep the source skill unchanged while branding its published artifact.
      const content = original.replace(/^(name:)[^\r\n]*$/m, `$1 ${name}`)
      const published = metadataSchema.parse(parse(content.split(/^---\r?$/m)[1] ?? ''))
      if (published.name !== name) {
        throw new Error(`Unable to set published skill name ${name}`)
      }
      return {
        path: join(destination, name, 'SKILL.md'),
        content,
        entry: {
          name,
          type: 'skill-md',
          description: metadata.description,
          url: `/.well-known/agent-skills/${name}/SKILL.md`,
          digest: `sha256:${createHash('sha256').update(content).digest('hex')}`,
        },
      }
    }),
  )
  const index = {
    $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    skills: artifacts.map(({ entry }) => entry),
  }
  const files = [
    ...artifacts,
    { path: join(destination, 'index.json'), content: `${JSON.stringify(index, null, 2)}\n` },
  ]
  for (const file of files) {
    if (check) {
      const actual = await readFile(file.path, 'utf8').catch((error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') {
          return undefined
        }
        throw error
      })
      if (actual !== file.content) {
        throw new Error(`Stale or missing ${file.path}. Run pnpm script generate-agent-skills.`)
      }
    } else {
      await mkdir(dirname(file.path), { recursive: true })
      await writeFile(file.path, file.content)
    }
  }
}

/** Generate product skill artifacts, or verify committed artifacts without writing them. */
export const generateAgentSkills = new Command('generate-agent-skills')
  .description('Publish Scalar product skills and their discovery index')
  .option('--check', 'Fail if published skills or digests are stale')
  .action(async ({ check }: { check?: boolean }): Promise<void> => {
    await generateAgentSkillFiles(getWorkspaceRoot(), check)
  })
