#!/usr/bin/env node

// Tiny CLI shipped with @scalar/themes.
//
// Claude Code (and compatible agents) only auto-discover skills from a project's
// `.claude/skills` / `.agents/skills`, the user's `~/.claude/skills`, or installed
// plugins — never from `node_modules`. So a skill bundled in this package is inert
// until it is linked into one of those directories. This command does that linking.
//
// Usage:
//   npx @scalar/themes install-skill [destDir]
//
// `destDir` defaults to `.claude/skills` in the current working directory. Pass a
// different directory (for example `.agents/skills`) to target another skills root.

import { existsSync } from 'node:fs'
import { cp, lstat, mkdir, readdir, rm, symlink } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const USAGE = `@scalar/themes

Usage:
  npx @scalar/themes install-skill [destDir]

Installs the design-system skill shipped with @scalar/themes into a skills
directory (default: .claude/skills) so Claude Code can discover it.
`

/** Whether a path exists and is a symbolic link. */
const isSymlink = async (path) => {
  try {
    return (await lstat(path)).isSymbolicLink()
  } catch {
    return false
  }
}

const installSkills = async (destArg) => {
  // The script lives at <pkg>/scripts/cli.mjs and the skills at <pkg>/skills.
  const here = dirname(fileURLToPath(import.meta.url))
  const skillsSrc = resolve(here, '..', 'skills')

  if (!existsSync(skillsSrc)) {
    console.error(`No skills directory found at ${skillsSrc}`)
    process.exit(1)
  }

  const destDir = resolve(process.cwd(), destArg)
  await mkdir(destDir, { recursive: true })

  const skills = (await readdir(skillsSrc, { withFileTypes: true })).filter((entry) => entry.isDirectory())

  if (skills.length === 0) {
    console.error(`No skills to link in ${skillsSrc}`)
    process.exit(1)
  }

  for (const skill of skills) {
    const from = join(skillsSrc, skill.name)
    const to = join(destDir, skill.name)

    // Remove any existing link or copy first so re-running is idempotent.
    if (existsSync(to) || (await isSymlink(to))) {
      await rm(to, { recursive: true, force: true })
    }

    try {
      // Prefer a relative symlink so the skill stays in sync with the installed package.
      await symlink(relative(destDir, from), to, 'dir')
      console.log(`Linked ${skill.name} → ${relative(process.cwd(), to)}`)
    } catch {
      // Symlinks can fail on Windows without elevated permissions — fall back to a copy.
      await cp(from, to, { recursive: true })
      console.log(`Copied ${skill.name} → ${relative(process.cwd(), to)}`)
    }
  }

  console.log(`\nDone. ${skills.length} skill(s) available in ${destArg}.`)
}

const main = async () => {
  const [command, destArg = '.claude/skills'] = process.argv.slice(2)

  if (command !== 'install-skill') {
    console.log(USAGE)
    process.exit(command ? 1 : 0)
  }

  await installSkills(destArg)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
