import type { AsyncApiRenderOptions } from '../src/types'

/** Exact page selection from the loaded AsyncAPI description. */
export type Page = { label: string; options: AsyncApiRenderOptions }
/** Available pages and counts for the selected example. */
export type Manifest = { title: string; pages: Page[]; operations: number; models: number }
/** Exact Markdown, sanitized preview, and export measurements. */
export type ExportResult = { markdown: string; html: string; bytes: number; milliseconds: number }
