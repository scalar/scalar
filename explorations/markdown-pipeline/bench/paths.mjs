import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/** Shared locations, so every script runs from any working directory. */
export const HERE = fileURLToPath(new URL('.', import.meta.url))
export const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
/** `@scalar/markdown`, which holds both pipelines. Its `node_modules` has the unified stack. */
export const MARKDOWN = ROOT + 'packages/markdown'
/** The unified/remark/rehype renderer, kept in the package behind `@scalar/markdown/renderer`. */
export const UNIFIED_RENDERER = MARKDOWN + '/src/markdown/markdown.ts'
/** The unified renderer with today's API and no highlighter, measured as the baseline. */
export const BASELINE_SRC = HERE + 'baseline.ts'
/** The same, with `rehypeHighlight`, for comparing highlighted code blocks. */
export const BASELINE_HIGHLIGHTED_SRC = HERE + 'baseline-highlighted.ts'
/** The purpose-built pipeline that `@scalar/markdown` renders with. */
export const PROTOTYPE_SRC = MARKDOWN + '/src/pipeline/index.ts'
/** `htmlFromMarkdown` as `@scalar/markdown` exports it: the pipeline with `@scalar/highlight`. */
export const SHIPPED_SRC = MARKDOWN + '/src/markdown/index.ts'
/** Build outputs and downloads (git-ignored). */
export const OUT = fileURLToPath(new URL('../.out/', import.meta.url))
mkdirSync(OUT, { recursive: true })
export const BASELINE = OUT + 'baseline.mjs'
export const BASELINE_HIGHLIGHTED = OUT + 'baseline-highlighted.mjs'
export const BASELINE_NO_REPARSE = OUT + 'baseline-no-reparse.mjs'
export const PROTOTYPE = OUT + 'prototype.mjs'
export const SHIPPED = OUT + 'shipped.mjs'
export const CORPUS = OUT + 'corpus.json'
export const GFM_SPEC = OUT + 'gfm-spec.txt'
