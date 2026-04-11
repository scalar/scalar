// Checkout /tooling/scripts/README.md for more information on how to use this command.

import fs from 'node:fs/promises'
import path from 'node:path'

import as from 'ansis'
import { Command } from 'commander'

import { getWorkspaceRoot } from '@/helpers'

const BLOG_DIR = 'documentation/blog'
const INDEX_FILENAME = 'index.md'
const CONFIG_FILENAME = 'scalar.config.json'
const DESCRIPTION_LINES = 3

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

type BlogPost = {
  filename: string
  slug: string
  title: string
  date: Date
  dateLabel: string
  description: string
}

export const generateBlog = new Command('generate-blog')
  .description('Generate blog index cards and update scalar.config.json from post files')
  .action(async () => {
    await generateBlogFiles()
  })

async function generateBlogFiles(): Promise<void> {
  const root = getWorkspaceRoot()
  const blogDir = path.join(root, BLOG_DIR)
  const indexPath = path.join(blogDir, INDEX_FILENAME)
  const configPath = path.join(root, CONFIG_FILENAME)

  console.log(as.cyan('Scanning blog posts...\n'))

  let entries: string[]
  try {
    entries = await fs.readdir(blogDir)
  } catch (error) {
    console.error(as.red(`Failed to read blog directory: ${error instanceof Error ? error.message : String(error)}`))
    process.exit(1)
  }

  const postFilenames = entries.filter(
    (name) => name.endsWith('.md') && name !== INDEX_FILENAME && /^\d{4}-\d{2}-\d{2}-/.test(name),
  )

  if (postFilenames.length === 0) {
    console.log(as.yellow('No blog post files found (expected YYYY-MM-DD-slug.md).'))
    return
  }

  const posts: BlogPost[] = []

  for (const filename of postFilenames) {
    try {
      const post = await parseBlogPost(blogDir, filename)
      posts.push(post)
    } catch (error) {
      console.warn(as.yellow(`⚠ Skipping ${filename}: ${error instanceof Error ? error.message : String(error)}`))
    }
  }

  posts.sort((a, b) => b.date.getTime() - a.date.getTime())

  await updateIndex(root, indexPath, posts)
  await updateConfig(root, configPath, posts)
}

// ---------------------------------------------------------------------------
// Blog index (documentation/blog/index.md)
// ---------------------------------------------------------------------------

async function updateIndex(root: string, indexPath: string, posts: BlogPost[]): Promise<void> {
  const indexContent = await fs.readFile(indexPath, 'utf-8')
  const existingDescriptions = parseExistingDescriptions(indexContent)

  const postsWithDescriptions = posts.map((post) => {
    const custom = existingDescriptions.get(post.filename)
    return custom !== undefined ? { ...post, description: custom } : post
  })

  const cardsMarkdown = postsWithDescriptions.map((post) => formatCard(post)).join('\n\n')
  const newContent = replaceCardsSection(indexContent, cardsMarkdown)

  await fs.writeFile(indexPath, newContent)
  console.log(as.green(`✔ Updated ${path.relative(root, indexPath)} with ${posts.length} post(s).`))
}

// ---------------------------------------------------------------------------
// Config (scalar.config.json)
// ---------------------------------------------------------------------------

async function updateConfig(root: string, configPath: string, posts: BlogPost[]): Promise<void> {
  const raw = await fs.readFile(configPath, 'utf-8')
  const config = JSON.parse(raw)

  const blog = config?.navigation?.routes?.['/']?.children?.['/blog']
  if (!blog?.children?.['/posts']) {
    console.warn(as.yellow('⚠ Could not find /blog /posts in scalar.config.json — skipping config update.'))
    return
  }

  const existingChildren: Record<string, Record<string, unknown>> = (blog.children['/posts'].children ?? {}) as Record<
    string,
    Record<string, unknown>
  >

  const children: Record<string, Record<string, unknown>> = {}
  for (const post of posts) {
    const key = `/${post.slug}`
    const prev = existingChildren[key]
    const entry: Record<string, unknown> = {
      type: 'page',
      title: typeof prev?.title === 'string' ? prev.title : post.title,
      filepath: `${BLOG_DIR}/${post.filename}`,
    }
    if (prev?.head !== undefined) {
      entry.head = prev.head
    }
    children[key] = entry
  }

  blog.children['/posts'].children = children

  await fs.writeFile(configPath, JSON.stringify(config, null, 2) + '\n')
  console.log(as.green(`✔ Updated ${path.relative(root, configPath)} /blog /posts with ${posts.length} post(s).`))
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

async function parseBlogPost(blogDir: string, filename: string): Promise<BlogPost> {
  const filePath = path.join(blogDir, filename)
  const raw = await fs.readFile(filePath, 'utf-8')

  const dateMatch = filename.match(/^(\d{4})-(\d{2})-(\d{2})-/)
  if (!dateMatch) {
    throw new Error('Filename must match YYYY-MM-DD-slug.md')
  }
  const [, year = '0', month = '0', day = '0'] = dateMatch
  const date = new Date(Number.parseInt(year, 10), Number.parseInt(month, 10) - 1, Number.parseInt(day, 10))
  const dateLabel = formatDateLabel(date)

  const slug = filename.replace(/\.md$/, '')
  const title = extractTitle(raw)
  const description = extractDescription(raw)

  return { filename, slug, title, date, dateLabel, description }
}

function extractTitle(raw: string): string {
  const match = raw.match(/^#\s+(.+)$/m)
  if (!match?.[1]) {
    throw new Error('No # title found')
  }
  return match[1].trim()
}

function extractDescription(raw: string): string {
  const lines = raw.split('\n')
  const headingIndex = lines.findIndex((line) => /^#\s+/.test(line))
  const start = headingIndex === -1 ? 0 : headingIndex + 1
  return lines
    .slice(start, start + DESCRIPTION_LINES)
    .join('\n')
    .trim()
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function formatDateLabel(date: Date): string {
  const month = MONTH_NAMES[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()
  return `${month} ${day}, ${year}`
}

function formatCard(post: BlogPost): string {
  const escapedTitle = post.title.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `:::scalar-card{title="${escapedTitle}" href="./${post.filename}"}

::scalar-fineprint[${post.dateLabel}]{}

${post.description}
:::`
}

/**
 * Parse existing card descriptions from the index.
 * Supports both old format (description then fineprint) and new format (fineprint then description).
 */
function parseExistingDescriptions(indexContent: string): Map<string, string> {
  const map = new Map<string, string>()

  const newFormat = /:::scalar-card\{[^}]*href="\.\/([^"]+)"[^}]*\}\s*\n\s*::scalar-fineprint\[[^\]]*\]\{\}\s*\n([\s\S]*?)\n:::/g
  let match: RegExpExecArray | null
  while ((match = newFormat.exec(indexContent)) !== null) {
    const filename = match[1]
    const description = match[2]?.trim()
    if (filename && description) {
      map.set(filename, description)
    }
  }

  if (map.size === 0) {
    const oldFormat = /:::scalar-card\{[^}]*href="\.\/([^"]+)"[^}]*\}\s*\n([\s\S]*?)\n::scalar-fineprint/g
    while ((match = oldFormat.exec(indexContent)) !== null) {
      const filename = match[1]
      const description = match[2]?.trim()
      if (filename && description) {
        map.set(filename, description)
      }
    }
  }

  return map
}

const GENERATED_START = `<!-- generated
  Auto-generated by: pnpm --filter @scalar-internal/build-scripts start generate-blog
  Cards are built from YYYY-MM-DD-slug.md files in documentation/blog/.
  Descriptions are preserved between runs — new posts get auto-extracted text.
-->`
const GENERATED_END = '<!-- /generated -->'

/** Replace auto-generated content between `<!-- generated` and `<!-- /generated -->` markers. */
function replaceCardsSection(indexContent: string, cardsMarkdown: string): string {
  const startMatch = indexContent.match(/<!-- generated[\s\S]*?-->/)
  const endIndex = indexContent.indexOf(GENERATED_END)

  const generated = `${GENERATED_START}\n${cardsMarkdown}\n${GENERATED_END}`

  if (!startMatch || endIndex === -1) {
    return `${indexContent.trimEnd()}\n\n${generated}\n`
  }

  const before = indexContent.slice(0, startMatch.index)
  const after = indexContent.slice(endIndex + GENERATED_END.length)
  return `${before}${generated}${after}`
}
