import { describe, expect, it } from 'vitest'

import { SCOPES } from '../core/scopes'
import { highlight, registerLanguage, tokenize } from '../index'
import r from './r'

// Registered here so this suite stands on its own rather than depending on
// `src/all.ts` import order; registering twice is harmless.
// The registry is a module-level singleton, and re-registering is idempotent.
registerLanguage(r)

const known = new Set(Object.keys(SCOPES))

/**
 * Tokens as the renderer sees them: adjacent ranges sharing a scope are one
 * run, so a quoted string is `"abc"` rather than three separate pieces.
 */
const runs = (code: string, lang: string): [string, string | null][] => {
  const out: [string, string | null][] = []
  for (const token of tokenize(code, lang)) {
    const last = out[out.length - 1]
    if (last && last[1] === token.scope) last[0] += token.text
    else out.push([token.text, token.scope])
  }
  return out
}

/** All (text, scope) pairs for runs that carry a scope. */
const scoped = (code: string, lang: string): [string, string][] => {
  return runs(code, lang).filter((r) => r[1] !== null) as [string, string][]
}

const assertHas = (code: string, lang: string, text: string, scope: string): void => {
  const pairs = scoped(code, lang)
  expect(
    pairs.some(([t, s]) => t === text && s === scope),
    `expected ${JSON.stringify(text)} to be ${scope} in ${lang}, got ${JSON.stringify(
      pairs.filter(([t]) => t === text),
    )}`,
  ).toBeTruthy()
}

/**
 * Idiomatic R, chosen for the constructs that break regex tokenizers: `%…%`
 * infix operators, backtick-quoted names, raw strings, `<-` beside `<`, the
 * `~` formula, `::` access, and every numeric literal form R has.
 */
const SAMPLE = `library(stats)
requireNamespace("R6", quietly = TRUE)

#' Summarise bike trips by station.
#'
#' @param trips A data.frame of raw trip rows.
#' @param keep_na Keep rows whose duration is missing.
#' @return A data.frame ordered by median duration.
summarise_trips <- function(trips, min_trips = 25L, keep_na = FALSE) {
  stopifnot(is.data.frame(trips), min_trips > 0L)

  # Durations arrive in seconds; everything downstream wants minutes.
  trips$duration <- trips$duration_sec / 60
  active <- trips$station %in% ACTIVE_STATIONS

  if (!keep_na) {
    active <- active & !is.na(trips$duration)
  }

  out <- trips[active, c("station", "duration")]
  out$flagged <- ifelse(out$duration > 90, TRUE, NA)
  return(out)
}

\`%+%\` <- function(a, b) paste0(a, b)

MAX_GAP <- 1e-3
ACTIVE_STATIONS <- c("kendall", "harvard", "porter")
CONFIG_PATH <- r"(C:\\raw\\trips.csv)"

read_config <- function(path = CONFIG_PATH, encoding = "UTF-8") {
  if (!file.exists(path)) {
    stop("missing config:\\t" %+% path, call. = FALSE)
  }
  utils::read.csv(path, stringsAsFactors = FALSE, fileEncoding = encoding)
}

scores <- data.frame(
  station = ACTIVE_STATIONS,
  \`p value\` = c(0.04, .5, NA_real_),
  weight = c(1L, 2L, 3L),
  check.names = FALSE
)

fit <- stats::lm(duration ~ weight + station, data = scores)
resid_sd <- sqrt(sum(fit$residuals^2) / max(1L, nrow(scores) - 2L))

normalise <- \\(x) (x - mean(x, na.rm = TRUE)) / stats::sd(x)
scaled <- vapply(scores[, "weight"], normalise, numeric(1L))

report <- function(rows, verbose = TRUE) {
  total <- 0L
  for (i in seq_len(nrow(rows))) {
    if (is.na(rows$weight[i])) next
    if (rows$weight[i] < -1) break
    total <- total + rows$weight[i]
    if (verbose) cat(sprintf("%-10s %0.2f\\n", rows$station[i], rows$weight[i]))
  }
  invisible(total)
}

phase <- 0xFFL + 2i
repeat {
  phase <- phase * 0.5
  if (Mod(phase) < MAX_GAP || is.infinite(phase)) break
}

StationStore <- R6::R6Class("StationStore", public = list(
  add = function(x) invisible(x)
))
store <- StationStore$new()

setClass("Station", representation(name = "character"))
kendall <- new("Station", name = "kendall")
kendall@name %>% toupper() -> shout
`

describe('r', () => {
  it('emits tokens that cover the source exactly', () => {
    expect(
      tokenize(SAMPLE, 'r')
        .map((t) => t.text)
        .join(''),
    ).toBe(SAMPLE)
  })

  it('emits ranges that agree with their text', () => {
    for (const token of tokenize(SAMPLE, 'r')) {
      expect(SAMPLE.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('only uses scopes from the shared vocabulary', () => {
    for (const token of tokenize(SAMPLE, 'r')) {
      if (token.scope !== null) {
        expect(known.has(token.scope), `r emitted unregistered scope "${token.scope}"`).toBeTruthy()
      }
    }
  })

  it('round-trips through the HTML renderer', () => {
    const text = highlight(SAMPLE, 'r')
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
    expect(text).toBe(SAMPLE)
  })

  it('terminates and stays consistent on every truncation', () => {
    // A state that never pops shows up here and nowhere else: this is what an
    // editor feeds the highlighter on every keystroke.
    const step = Math.max(1, Math.floor(SAMPLE.length / 60))
    for (let end = 0; end <= SAMPLE.length; end += step) {
      const prefix = SAMPLE.slice(0, end)
      expect(
        tokenize(prefix, 'r')
          .map((t) => t.text)
          .join(''),
      ).toBe(prefix)
    }
  })

  it('separates control flow from the declaration keyword', () => {
    const code = 'f <- function(x) {\n  if (x > 0) return(x)\n}\n'
    assertHas(code, 'r', 'function', 'keyword.declaration')
    assertHas(code, 'r', 'return', 'keyword.control')
    assertHas(code, 'r', 'if', 'keyword.control')
  })

  it('tells the definition site from the call site', () => {
    assertHas('normalise <- function(x) x\n', 'r', 'normalise', 'function')
    assertHas('y <- normalise(x)\n', 'r', 'normalise', 'function.call')
  })

  it('scopes a backtick-quoted operator definition as a function', () => {
    const code = '`%+%` <- function(a, b) paste0(a, b)\n'
    assertHas(code, 'r', '`%+%`', 'function')
    // The same spelling used as an operator, not defined as one.
    assertHas('x <- "a" %+% "b"\n', 'r', '%+%', 'operator')
  })

  it('reads %in% as a word operator and other infix as plain operators', () => {
    assertHas('hit <- id %in% keys\n', 'r', '%in%', 'keyword.operator')
    assertHas('out <- df %>% head()\n', 'r', '%>%', 'operator')
  })

  it('does not confuse assignment with a comparison against a negative', () => {
    assertHas('total <- 1\n', 'r', '<-', 'operator')
    const compare = scoped('if (weight < -1) stop()\n', 'r')
    expect(compare.some(([t, s]) => t === '<' && s === 'operator')).toBeTruthy()
    expect(compare.some(([t]) => t === '<-')).toBeFalsy()
  })

  it('names an argument inside a call but not an assignment at top level', () => {
    assertHas('fit(data = scores, na.rm = TRUE)\n', 'r', 'data', 'variable.parameter')
    const assignment = scoped('data = scores\n', 'r')
    expect(assignment.some(([t, s]) => t === 'data' && s === 'variable.parameter')).toBeFalsy()
  })

  it('tells a parameter from the default value it is given', () => {
    const code = 'f <- function(min_trips = MAX_GAP, keep = TRUE) min_trips\n'
    assertHas(code, 'r', 'min_trips', 'variable.parameter')
    assertHas(code, 'r', 'MAX_GAP', 'constant')
    assertHas(code, 'r', 'TRUE', 'boolean')
  })

  it('separates a builtin type from a user-defined class', () => {
    assertHas('df <- data.frame(x = 1L)\n', 'r', 'data.frame', 'type.builtin')
    assertHas('store <- StationStore$new()\n', 'r', 'StationStore', 'type')
    assertHas('store <- StationStore$new()\n', 'r', 'new', 'function.method')
  })

  it('scopes a namespace apart from the function it qualifies', () => {
    const code = 'v <- stats::sd(x)\n'
    assertHas(code, 'r', 'stats', 'namespace')
    assertHas(code, 'r', '::', 'operator')
    assertHas(code, 'r', 'sd', 'function.call')
    assertHas('library(stats)\n', 'r', 'stats', 'namespace')
  })

  it('leaves a raw string uninterpreted but escapes an ordinary one', () => {
    assertHas('p <- r"(C:\\raw\\n)"\n', 'r', 'r', 'string.special')
    assertHas('p <- r"(C:\\raw\\n)"\n', 'r', '"(C:\\raw\\n)"', 'string')
    assertHas('p <- "C:\\traw"\n', 'r', '\\t', 'string.escape')
  })

  it('handles every numeric literal form without eating a dotted name', () => {
    for (const literal of ['25L', '2i', '0xFF', '1e-3', '.5', '0.04']) {
      assertHas(`x <- ${literal}\n`, 'r', literal, 'number')
    }
    // `.` is a name character, so the `1` here is part of the name.
    expect(scoped('model.1 <- fit\n', 'r').some(([, s]) => s === 'number')).toBeFalsy()
  })

  it('scopes roxygen apart from an ordinary comment', () => {
    assertHas("#' @param x A vector.\n", 'r', '@param', 'decorator')
    assertHas("#' Summarise trips.\n", 'r', "#' Summarise trips.", 'comment.doc')
    assertHas('# just a note\n', 'r', '# just a note', 'comment')
  })
})
