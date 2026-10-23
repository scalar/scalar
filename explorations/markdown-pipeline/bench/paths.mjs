import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/** Shared locations, so every script runs from any working directory. */
export const HERE = fileURLToPath(new URL('.', import.meta.url))
export const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
/** The current pipeline, measured as the baseline. */
export const CODE_HIGHLIGHT = ROOT + 'packages/code-highlight'
export const PROTOTYPE_SRC = fileURLToPath(new URL('../src/index.ts', import.meta.url))
/** Build outputs and downloads (git-ignored). */
export const OUT = fileURLToPath(new URL('../.out/', import.meta.url))
mkdirSync(OUT, { recursive: true })
export const BASELINE = OUT + 'baseline.mjs'
export const BASELINE_HIGHLIGHTED = OUT + 'baseline-highlighted.mjs'
export const BASELINE_NO_REPARSE = OUT + 'baseline-no-reparse.mjs'
export const PROTOTYPE = OUT + 'prototype.mjs'
export const CORPUS = OUT + 'corpus.json'
export const GFM_SPEC = OUT + 'gfm-spec.txt'
