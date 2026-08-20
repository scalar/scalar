import { describe, expect, it } from 'vitest'

import { textFromHtml } from '../../test/html'
import { SCOPES } from '../core/scopes'
import { highlight, registerLanguage, tokenize } from '../index'
import clojure from './clojure'

registerLanguage(clojure)

const known = new Set(Object.keys(SCOPES))

/**
 * Idiomatic Clojure, written to hit the reader forms that break a regex
 * tokenizer: char literals that hold a `;`, a `"` or a `(`, a regex literal
 * with an escaped quote inside it, syntax-quote and unquote in a macro body,
 * and every numeric literal form the reader accepts.
 *
 * Every backslash is doubled because this is a template literal — the Clojure
 * source sees a single one.
 */
const SAMPLE = `#!/usr/bin/env bb
;; Inventory report — the reader forms a regex tokenizer trips over.
(ns acme.inventory
  "Totals, taxes and a little Java interop."
  (:require [clojure.string :as str]
            [clojure.set :refer [union]])
  (:import (java.time Instant)
           (java.util Date)))

(def ^:private tax-rate 0.0825M)
(def limits {:min 1, :max 9999, ::scope :global})
(defonce started-at (Instant/now))

;; Every literal form the reader accepts.
(def numbers
  {:int 42
   :negative -17
   :hex 0xFF
   :radix 2r1011
   :ratio 22/7
   :bigint 9007199254740993N
   :bigdec 1.5M
   :double 3.14159
   :sci 6.02e23
   :infinite ##Inf})

(def reader-chars [\\a \\tab \\newline \\space \\( \\; \\" \\\\ \\u00e9])

(def date-pattern #"[0-9]{4}-[0-9]{2}-[0-9]{2}")
(def field-pattern #"^(\\w+)\\s*:\\s*\\"([^\\"]*)\\"$")

(def banner "tab\\there, a quote \\" and a newline\\nplus \\u2713")

(defprotocol Priced
  (price [this] "Amount in cents, before tax."))

(defrecord LineItem [sku qty unit-price]
  Priced
  (price [this] (* qty unit-price)))

(defn- parse-qty
  "Reads s as a quantity, falling back to 1 when it is not a number."
  ^long [^String s]
  (try
    (Integer/parseInt (str/trim s))
    (catch Exception _
      1)))

(defn line-total
  "Total for one item, tax included."
  [{:keys [qty unit-price] :or {qty 1}} & [rate]]
  (let [subtotal (* (parse-qty qty) unit-price)
        rate (or rate tax-rate)]
    (if (pos? subtotal)
      (+ subtotal (* subtotal rate))
      0)))

(defmulti describe :kind)
(defmethod describe :box [{:keys [sku]}] (str "box " sku))
(defmethod describe :default [_] "unknown")

(defmacro with-timing [label & body]
  \`(let [start# (System/nanoTime)]
     (try ~@body
          (finally
            (println ~label (- (System/nanoTime) start#))))))

(defn report [items]
  (->> items
       (filter #(pos? (:qty %)))
       (map (juxt :sku line-total))
       (sort-by second >)
       (take 10)
       (reduce (fn [acc [sku total]] (assoc acc sku total)) {})))

#_(report [{:sku "A-1" :qty 2 :unit-price 350}])

(when-let [d (Date.)]
  (let [item (LineItem. "A-1" 2 350)]
    (println (.getTime d) (.-sku item) (union #{:a} #{:b}))
    (println (str/join ", " ["ok" (.toUpperCase "x")]) #?(:clj "jvm" :cljs "js"))))
`

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

describe('clojure', () => {
  it('emits tokens that cover the source exactly', () => {
    expect(
      tokenize(SAMPLE, 'clojure')
        .map((t) => t.text)
        .join(''),
    ).toBe(SAMPLE)
  })

  it('emits ranges that agree with their text', () => {
    for (const token of tokenize(SAMPLE, 'clojure')) {
      expect(SAMPLE.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('only uses scopes from the shared vocabulary', () => {
    for (const token of tokenize(SAMPLE, 'clojure')) {
      if (token.scope !== null) {
        expect(known.has(token.scope), `clojure emitted unregistered scope "${token.scope}"`).toBeTruthy()
      }
    }
  })

  it('round-trips through the HTML renderer', () => {
    const text = textFromHtml(highlight(SAMPLE, 'clojure'))
    expect(text).toBe(SAMPLE)
  })

  it('terminates and stays consistent on every truncation', () => {
    // A half-typed `#"`, `\` or `"` is what an editor feeds a highlighter on
    // every keystroke, and a state that never pops shows up here first.
    for (let end = 0; end <= SAMPLE.length; end++) {
      const prefix = SAMPLE.slice(0, end)
      expect(
        tokenize(prefix, 'clojure')
          .map((t) => t.text)
          .join(''),
      ).toBe(prefix)
    }
  })

  // The assertions below are the readings a reviewer would argue about, not the
  // ones any highlighter gets right.

  it('scopes a name by the form that introduced it', () => {
    // `defn` names a function, `defrecord` names a type, `def` names a value.
    assertHas(SAMPLE, 'clojure', 'parse-qty', 'function')
    assertHas(SAMPLE, 'clojure', 'LineItem', 'class')
    assertHas(SAMPLE, 'clojure', 'tax-rate', 'variable')
  })

  it('tells a definition site from a call site for the same symbol', () => {
    // `parse-qty` is defined once and called once; only the call is a call.
    assertHas(SAMPLE, 'clojure', 'parse-qty', 'function.call')
  })

  it('reads a docstring as documentation and a returned string as a string', () => {
    assertHas(SAMPLE, 'clojure', '"Total for one item, tax included."', 'comment.doc')
    assertHas(SAMPLE, 'clojure', '"unknown"', 'string')
  })

  it('separates control flow from declarations and threading macros', () => {
    assertHas(SAMPLE, 'clojure', 'when-let', 'keyword.control')
    assertHas(SAMPLE, 'clojure', 'let', 'keyword.declaration')
    assertHas(SAMPLE, 'clojure', '->>', 'keyword.operator')
  })

  it('tells a builtin Java class from a user type', () => {
    assertHas(SAMPLE, 'clojure', 'System', 'type.builtin')
    assertHas(SAMPLE, 'clojure', 'Instant', 'type')
    assertHas(SAMPLE, 'clojure', 'nanoTime', 'function.method')
  })

  it('reads a keyword in head position as a lookup, not as a call', () => {
    assertHas(SAMPLE, 'clojure', ':qty', 'constant')
  })

  it('splits a namespaced call into its namespace and the function', () => {
    assertHas(SAMPLE, 'clojure', 'str', 'namespace')
    assertHas(SAMPLE, 'clojure', 'join', 'function.call')
  })

  it('keeps interop methods and fields apart', () => {
    assertHas(SAMPLE, 'clojure', 'getTime', 'function.method')
    assertHas(SAMPLE, 'clojure', 'sku', 'variable.member')
  })

  it('reads a ratio as a number rather than as a namespaced symbol', () => {
    assertHas(SAMPLE, 'clojure', '22/7', 'number')
    assertHas(SAMPLE, 'clojure', '2r1011', 'number')
    assertHas(SAMPLE, 'clojure', '##Inf', 'number')
  })

  it('does not let a char literal start a comment or a string', () => {
    assertHas(SAMPLE, 'clojure', '\\;', 'string')
    assertHas(SAMPLE, 'clojure', '\\"', 'string')
    assertHas(SAMPLE, 'clojure', '\\newline', 'string')
  })

  it('scopes a regex literal as a regex, not as a string', () => {
    assertHas(SAMPLE, 'clojure', '#"[0-9]{4}-[0-9]{2}-[0-9]{2}"', 'regexp')
    // `\"` inside `#"…"` closes nothing, so the literal runs to its real end.
    assertHas(SAMPLE, 'clojure', '\\w', 'string.escape')
  })

  it('scopes metadata and anonymous-function parameters', () => {
    assertHas(SAMPLE, 'clojure', '^:private', 'decorator')
    assertHas(SAMPLE, 'clojure', '%', 'variable.parameter')
  })

  it('scopes rules the sample never reaches', () => {
    // Shipped rules the SAMPLE does not reach; asserted so they cannot regress
    // without a test noticing.
    const code = '(if (nil? x) true false)\n'
    assertHas(code, 'clojure', 'true', 'boolean')
    assertHas(code, 'clojure', 'false', 'boolean')
    assertHas('(def x nil)\n', 'clojure', 'nil', 'constant.builtin')
  })
})
