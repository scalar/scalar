// Checkout /tooling/scripts/README.md for more information on how to use this command.

import fs from 'node:fs/promises'
import path from 'node:path'

import as from 'ansis'
import { Command } from 'commander'

import { getWorkspaceRoot } from '@/helpers'

const BLOG_DIR = 'documentation/blog'
const INDEX_FILENAME = 'index.md'
const DESCRIPTION_LINES = 5

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

type BlogPost = {
  filename: string
  title: string
  date: Date
  dateLabel: string
  description: string
}

export const generateBlogIndex = new Command('generate-blog-index')
  .description('Generate blog index cards in documentation/blog/index.md from post files')
  .action(async () => {
    await generateBlogIndexFile()
  })

async function generateBlogIndexFile(): Promise<void> {
  const root = getWorkspaceRoot()
  const blogDir = path.join(root, BLOG_DIR)
  const indexPath = path.join(blogDir, INDEX_FILENAME)

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

  const indexContent = await fs.readFile(indexPath, 'utf-8')
  const existingDescriptions = parseExistingDescriptions(indexContent)

  for (const post of posts) {
    const custom = existingDescriptions.get(post.filename)
    if (custom !== undefined) {
      post.description = custom
    }
  }

  const cardsMarkdown = posts.map((post) => formatCard(post)).join('\n\n')
  const newContent = replaceCardsSection(indexContent, cardsMarkdown)

  await fs.writeFile(indexPath, newContent)
  console.log(as.green(`✔ Updated ${path.relative(root, indexPath)} with ${posts.length} post(s).`))
}

async function parseBlogPost(blogDir: string, filename: string): Promise<BlogPost> {
  const filePath = path.join(blogDir, filename)
  const raw = await fs.readFile(filePath, 'utf-8')

  const dateMatch = filename.match(/^(\d{4})-(\d{2})-(\d{2})-/)
  if (!dateMatch) {
    throw new Error('Filename must match YYYY-MM-DD-slug.md')
  }
  const [, year, month, day] = dateMatch
  const date = new Date(Number.parseInt(year!, 10), Number.parseInt(month!, 10) - 1, Number.parseInt(day!, 10))
  const dateLabel = formatDateLabel(date)

  const title = extractTitle(raw)
  const description = extractDescription(raw)

  return {
    filename,
    title,
    date,
    dateLabel,
    description,
  }
}

function extractTitle(raw: string): string {
  const match = raw.match(/^#\s+(.+)$/m)
  if (!match) {
    throw new Error('No # title found')
  }
  return match[1]!.trim()
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

function formatDateLabel(date: Date): string {
  const month = MONTH_NAMES[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()
  return `${month} ${day}, ${year}`
}

function formatCard(post: BlogPost): string {
  const escapedTitle = post.title.replace(/"/g, '\\"')
  return `:::scalar-card{title="${escapedTitle}" href="./${post.filename}"}

<!-- description:${post.filename} -->
${post.description}
<!-- /description -->

::scalar-fineprint[${post.dateLabel}]{}
:::`
}

/**
 * Parse existing card descriptions by looking for
 * `<!-- description:filename.md -->` ... `<!-- /description -->` markers.
 * Content between those markers is preserved on the next run.
 */
function parseExistingDescriptions(indexContent: string): Map<string, string> {
  const map = new Map<string, string>()
  const descBlock = /<!-- description:(\S+?) -->\n([\s\S]*?)\n<!-- \/description -->/g
  let match: RegExpExecArray | null
  while ((match = descBlock.exec(indexContent)) !== null) {
    const filename = match[1]!
    const description = match[2]!.trim()
    if (description) {
      map.set(filename, description)
    }
  }
  return map
}

/** Replace the cards section between "# Posts" and "<style>" (or end of file). */
function replaceCardsSection(indexContent: string, cardsMarkdown: string): string {
  const postsHeader = '# Posts'
  const styleStart = indexContent.indexOf('<style>')
  const headerIndex = indexContent.indexOf(postsHeader)
  if (headerIndex === -1) {
    return `${postsHeader}\n\n${cardsMarkdown}\n`
  }
  const headerEnd = headerIndex + postsHeader.length
  if (styleStart === -1) {
    return `${indexContent.slice(0, headerEnd)}\n\n${cardsMarkdown}\n`
  }
  const styleBlock = indexContent.slice(styleStart)
  return `${indexContent.slice(0, headerEnd)}\n\n${cardsMarkdown}\n\n${styleBlock}`
}
