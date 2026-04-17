// Checkout /tooling/scripts/README.md for more information on how to use this command.

import fs from 'node:fs/promises'
import path from 'node:path'

import as from 'ansis'
import { Command } from 'commander'

import { getWorkspaceRoot } from '@/helpers'

const BLOG_DIR = 'documentation/blog'
const INDEX_FILENAME = 'index.md'
const CONFIG_FILENAME = 'scalar.config.json'
const DESCRIPTION_LINES = 20
const SUMMARY_MAX_LENGTH = 220

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
  .description('Generate blog index post rows and update scalar.config.json from post files')
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
    return custom !== undefined ? { ...post, description: normalizeDescription(custom) } : post
  })

  const rowsMarkdown = postsWithDescriptions.map((post) => formatPostRow(post)).join('\n')
  const newContent = replaceRowsSection(indexContent, rowsMarkdown)

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
  if (!blog?.children || typeof blog.children !== 'object') {
    console.warn(as.yellow('⚠ Could not find /blog children in scalar.config.json — skipping config update.'))
    return
  }

  blog.mode = 'flat'

  const overviewPage = normalizeOverviewPage(blog.children['/'])
  const existingChildren = collectExistingPostChildren(blog.children as Record<string, unknown>)

  const children: Record<string, Record<string, unknown>> = {}
  children['/'] = overviewPage

  for (const post of posts) {
    const key = `/posts/${post.slug}`
    const prev = existingChildren[key]
    const entry: Record<string, unknown> = {
      type: 'page',
      title: typeof prev?.title === 'string' ? prev.title : post.title,
      filepath: `${BLOG_DIR}/${post.filename}`,
      showInSidebar: false,
    }
    const layout = stripSidebarLayout(prev?.layout)
    if (layout !== undefined) {
      entry.layout = layout
    }
    if (prev?.head !== undefined) {
      entry.head = prev.head
    }
    children[key] = entry
  }

  blog.children = children

  await fs.writeFile(configPath, JSON.stringify(config, null, 2) + '\n')
  console.log(as.green(`✔ Updated ${path.relative(root, configPath)} /blog with ${posts.length} post(s).`))
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
  const candidate = extractFirstTextParagraph(lines.slice(start, start + DESCRIPTION_LINES))
  return normalizeDescription(candidate)
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

function formatPostRow(post: BlogPost): string {
  return `<article class="blog-post-list__item" data-file="${escapeHtml(post.filename)}">
  <a class="blog-post-list__link" href="./${escapeHtml(post.filename)}">
    <div class="blog-post-list__meta">${escapeHtml(post.dateLabel)}</div>
    <h2 class="blog-post-list__title">${escapeHtml(post.title)}</h2>
    <p class="blog-post-list__description">${escapeHtml(post.description)}</p>
  </a>
</article>`
}

/**
 * Parse existing row descriptions from the current layout and from the previous
 * card layout so custom summaries survive migration.
 */
function parseExistingDescriptions(indexContent: string): Map<string, string> {
  const map = new Map<string, string>()
  const rowBlock =
    /<article class="blog-post-list__item" data-file="([^"]+)">[\s\S]*?<p class="blog-post-list__description">([\s\S]*?)<\/p>[\s\S]*?<\/article>/g
  let match: RegExpExecArray | null
  while ((match = rowBlock.exec(indexContent)) !== null) {
    const filename = match[1]
    const description = decodeHtmlEntities(match[2] ?? '').trim()
    if (filename && description) {
      map.set(filename, description)
    }
  }

  const cardBlock = /:::scalar-card\{[^}]*href="\.\/([^"]+)"[^}]*\}\s*\n([\s\S]*?)\n::scalar-fineprint/g
  let cardMatch: RegExpExecArray | null
  while ((cardMatch = cardBlock.exec(indexContent)) !== null) {
    const filename = cardMatch[1]
    const description = normalizeDescription(cardMatch[2] ?? '')
    if (filename && description) {
      map.set(filename, description)
    }
  }
  return map
}

const GENERATED_START = `<!-- generated
  Auto-generated by: pnpm --filter @scalar-internal/build-scripts start generate-blog
  Post rows are built from YYYY-MM-DD-slug.md files in documentation/blog/.
  Summaries are preserved between runs and normalized for brevity.
-->`
const GENERATED_END = '<!-- /generated -->'

/** Replace auto-generated content between `<!-- generated` and `<!-- /generated -->` markers. */
function replaceRowsSection(indexContent: string, rowsMarkdown: string): string {
  const startMatch = indexContent.match(/<!-- generated[\s\S]*?-->/)
  const endIndex = indexContent.indexOf(GENERATED_END)

  const generated = `${GENERATED_START}
<div class="blog-post-list">
${rowsMarkdown}
</div>
${GENERATED_END}`

  if (!startMatch || endIndex === -1) {
    return `${indexContent.trimEnd()}\n\n${generated}\n`
  }

  const before = indexContent.slice(0, startMatch.index)
  const after = indexContent.slice(endIndex + GENERATED_END.length)
  return `${before}${generated}${after}`
}

function extractFirstTextParagraph(lines: string[]): string {
  const chunks: string[] = []
  let currentChunk: string[] = []
  let isCodeBlock = false

  for (const line of lines) {
    const trimmedLine = line.trim()

    if (trimmedLine.startsWith('```')) {
      isCodeBlock = !isCodeBlock
      continue
    }

    if (isCodeBlock) {
      continue
    }

    if (trimmedLine.length === 0) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '))
        currentChunk = []
      }
      continue
    }

    currentChunk.push(trimmedLine)
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '))
  }

  const bestChunk = chunks.find((chunk) => isMeaningfulParagraph(chunk))
  return bestChunk ?? ''
}

function isMeaningfulParagraph(paragraph: string): boolean {
  if (!paragraph) {
    return false
  }

  const trimmedParagraph = paragraph.trim()
  if (
    trimmedParagraph.startsWith('#') ||
    trimmedParagraph.startsWith(':::') ||
    trimmedParagraph.startsWith('<') ||
    trimmedParagraph.startsWith('![') ||
    /^\[.*\]\(.*\)$/.test(trimmedParagraph)
  ) {
    return false
  }

  return /[a-z0-9]/i.test(trimmedParagraph)
}

function normalizeDescription(description: string): string {
  const firstParagraph = description
    .split('\n\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0)

  if (!firstParagraph) {
    return 'Read the full post.'
  }

  const plainText = stripMarkdown(firstParagraph).replace(/\s+/g, ' ').trim()
  if (!plainText) {
    return 'Read the full post.'
  }

  return truncateText(plainText, SUMMARY_MAX_LENGTH)
}

function stripMarkdown(value: string): string {
  return value
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[\d+\]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value
  }

  const slice = value.slice(0, maxLength + 1)
  const lastSpace = slice.lastIndexOf(' ')
  const safeLength = lastSpace > maxLength * 0.6 ? lastSpace : maxLength
  return `${slice.slice(0, safeLength).trimEnd()}…`
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

function decodeHtmlEntities(value: string): string {
  return value.replaceAll('&quot;', '"').replaceAll('&gt;', '>').replaceAll('&lt;', '<').replaceAll('&amp;', '&')
}

function collectExistingPostChildren(children: Record<string, unknown>): Record<string, Record<string, unknown>> {
  const entries: Record<string, Record<string, unknown>> = {}

  const postsGroup = children['/posts']
  const nestedChildren =
    postsGroup &&
    typeof postsGroup === 'object' &&
    typeof postsGroup.children === 'object' &&
    postsGroup.children !== null
      ? (postsGroup.children as Record<string, unknown>)
      : {}

  for (const [key, value] of Object.entries(nestedChildren)) {
    if (typeof value === 'object' && value !== null) {
      const normalizedKey = key.startsWith('/posts/') ? key : `/posts${key}`
      entries[normalizedKey] = value as Record<string, unknown>
    }
  }

  for (const [key, value] of Object.entries(children)) {
    if (key.startsWith('/posts/') && typeof value === 'object' && value !== null) {
      entries[key] = value as Record<string, unknown>
    }
  }

  return entries
}

function normalizeOverviewPage(overview: unknown): Record<string, unknown> {
  const previous = typeof overview === 'object' && overview !== null ? (overview as Record<string, unknown>) : {}
  const normalized: Record<string, unknown> = {
    type: 'page',
    title: 'Blog',
    filepath: typeof previous.filepath === 'string' ? previous.filepath : `${BLOG_DIR}/${INDEX_FILENAME}`,
    showInSidebar: false,
  }
  const layout = stripSidebarLayout(previous.layout)
  if (layout !== undefined) {
    normalized.layout = layout
  }
  return normalized
}

function stripSidebarLayout(layout: unknown): Record<string, unknown> | undefined {
  if (typeof layout !== 'object' || layout === null) {
    return undefined
  }

  const nextLayout = { ...(layout as Record<string, unknown>) }
  delete nextLayout.sidebar

  return Object.keys(nextLayout).length > 0 ? nextLayout : undefined
}
