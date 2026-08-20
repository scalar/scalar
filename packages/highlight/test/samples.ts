/**
 * Realistic samples, chosen to exercise the cases that separate a good
 * highlighter from a bad one. Shared by the tests, the benchmark and the demo
 * page so all three stay honest about the same code.
 */
/**
 * A lone `$`. A template literal cannot hold `${` of its own, and the Perl
 * sample needs both `${name}` and the `${\ … }` deref idiom.
 */
const D = '$'

export const samples: Record<string, string> = {
  python: `"""Rate limiting for the public API."""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Iterable, Protocol

DEFAULT_WINDOW = 60.0
_BUCKETS: dict[str, "TokenBucket"] = {}


class Clock(Protocol):
    def now(self) -> float: ...


@dataclass(slots=True)
class TokenBucket:
    """A leaky bucket, refilled continuously."""

    capacity: int
    refill_per_second: float
    _tokens: float = field(default=0.0, repr=False)
    _updated: float = 0.0

    def __post_init__(self) -> None:
        self._tokens = float(self.capacity)

    def consume(self, amount: int = 1, *, now: float | None = None) -> bool:
        now = time.monotonic() if now is None else now
        elapsed = now - self._updated
        self._tokens = min(self.capacity, self._tokens + elapsed * self.refill_per_second)
        self._updated = now

        if self._tokens < amount:
            return False
        self._tokens -= amount
        return True

    def __repr__(self) -> str:
        pct = 100 * self._tokens / self.capacity
        return f"<TokenBucket {self._tokens:.1f}/{self.capacity} ({pct:>5.1f}%)>"


async def throttle(keys: Iterable[str], *, burst: int = 10) -> list[str]:
    rejected = []
    for key in keys:
        bucket = _BUCKETS.setdefault(key, TokenBucket(burst, burst / DEFAULT_WINDOW))
        if not bucket.consume():
            rejected.append(key)
            print(f"rejected {key!r} at {time.time():.3f}", file=sys.stderr)
    match len(rejected):
        case 0:
            return []
        case n if n > 100:
            raise RuntimeError("too many rejections: %d" % n)
        case _:
            return rejected
`,

  javascript: `import { useCallback, useMemo, useRef } from 'react';

const CACHE_TTL = 5 * 60 * 1000;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Debounced, cached search over the document index.
 */
export function useSearch<T extends { id: string }>(
  index: SearchIndex<T>,
  { limit = 20, minLength = 2 }: SearchOptions = {},
): SearchResult<T> {
  const cache = useRef(new Map<string, T[]>());

  const search = useCallback(
    async (raw: string): Promise<T[]> => {
      const query = raw.trim().toLowerCase();
      if (query.length < minLength) return [];

      const hit = cache.current.get(query);
      if (hit !== undefined) return hit;

      const response = await fetch(\`/api/search?q=\${encodeURIComponent(query)}\`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(3_000),
      });
      if (!response.ok) {
        throw new Error(\`search failed: \${response.status} \${response.statusText}\`);
      }

      const { hits } = (await response.json()) as { hits: T[] };
      cache.current.set(query, hits.slice(0, limit));
      return hits;
    },
    [index, limit, minLength],
  );

  const empty = useMemo(() => (
    <div className="empty" role="status" aria-live="polite">
      <Icon name="search" size={24} />
      <p>No results. Try a shorter query.</p>
    </div>
  ), []);

  return { search, empty, valid: SLUG.test(index.name) };
}
`,

  typescript: `type Handler<E extends Event = Event> = (event: E) => void | Promise<void>;

export interface Emitter<Events extends Record<string, Event>> {
  on<K extends keyof Events>(type: K, handler: Handler<Events[K]>): () => void;
  emit<K extends keyof Events>(type: K, event: Events[K]): Promise<void>;
}

export function createEmitter<E extends Record<string, Event>>(): Emitter<E> {
  const handlers = new Map<keyof E, Set<Handler<never>>>();

  return {
    on(type, handler) {
      const set = handlers.get(type) ?? new Set();
      set.add(handler as Handler<never>);
      handlers.set(type, set);
      return () => void set.delete(handler as Handler<never>);
    },

    async emit(type, event) {
      const set = handlers.get(type);
      if (!set?.size) return;
      await Promise.all([...set].map((handler) => (handler as Handler)(event)));
    },
  };
}
`,

  rust: `use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// A bounded, thread-safe LRU cache.
#[derive(Debug, Clone)]
pub struct Cache<K, V> {
    inner: Arc<Mutex<HashMap<K, Entry<V>>>>,
    capacity: usize,
}

#[derive(Debug, Clone, PartialEq)]
struct Entry<V> {
    value: V,
    hits: u64,
}

impl<K: std::hash::Hash + Eq + Clone, V: Clone> Cache<K, V> {
    pub fn new(capacity: usize) -> Self {
        assert!(capacity > 0, "capacity must be positive");
        Self { inner: Arc::new(Mutex::new(HashMap::with_capacity(capacity))), capacity }
    }

    pub fn get(&self, key: &K) -> Option<V> {
        let mut guard = self.inner.lock().ok()?;
        let entry = guard.get_mut(key)?;
        entry.hits += 1;
        Some(entry.value.clone())
    }

    pub fn insert(&self, key: K, value: V) -> Result<(), CacheError> {
        let mut guard = self.inner.lock().map_err(|_| CacheError::Poisoned)?;
        if guard.len() >= self.capacity {
            let victim = guard.iter().min_by_key(|(_, e)| e.hits).map(|(k, _)| k.clone());
            if let Some(k) = victim {
                guard.remove(&k);
            }
        }
        guard.insert(key, Entry { value, hits: 0 });
        Ok(())
    }
}
`,

  go: `package cache

import (
	"context"
	"errors"
	"sync"
	"time"
)

var ErrNotFound = errors.New("cache: key not found")

// Store is a TTL cache safe for concurrent use.
type Store[V any] struct {
	mu      sync.RWMutex
	entries map[string]entry[V]
	ttl     time.Duration
}

type entry[V any] struct {
	value   V
	expires time.Time
}

func New[V any](ttl time.Duration) *Store[V] {
	return &Store[V]{entries: make(map[string]entry[V]), ttl: ttl}
}

func (s *Store[V]) Get(ctx context.Context, key string) (V, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var zero V
	e, ok := s.entries[key]
	if !ok || time.Now().After(e.expires) {
		return zero, ErrNotFound
	}
	select {
	case <-ctx.Done():
		return zero, ctx.Err()
	default:
		return e.value, nil
	}
}
`,

  bash: `#!/usr/bin/env bash
set -euo pipefail

readonly ROOT="\${BASH_SOURCE[0]%/*}/.."
readonly TAG="\${1:-latest}"
DRY_RUN="\${DRY_RUN:-0}"

log() {
  printf '[%s] %s\\n' "$(date -u +%H:%M:%S)" "$*" >&2
}

deploy() {
  local service="$1" region="\${2:-us-east-1}"

  if [[ ! -f "$ROOT/services/$service/Dockerfile" ]]; then
    log "no Dockerfile for $service"
    return 1
  fi

  docker build \\
    --tag "registry.internal/\${service}:\${TAG}" \\
    --build-arg "COMMIT=$(git rev-parse --short HEAD)" \\
    "$ROOT/services/$service"

  if (( DRY_RUN )); then
    log "dry run: skipping push to $region"
  else
    docker push "registry.internal/\${service}:\${TAG}"
  fi
}

for svc in "$@"; do
  case "$svc" in
    --*) continue ;;
    *) deploy "$svc" && log "deployed $svc" ;;
  esac
done
`,

  css: `@import url('https://fonts.example/inter.css') layer(base);

:root {
  --surface: oklch(21% 0.02 250);
  --text: #c6d0da;
  --radius: 0.5rem;
  --shadow: 0 1px 2px rgb(0 0 0 / 0.4), 0 8px 24px rgb(0 0 0 / 0.24);
}

.card {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: clamp(0.75rem, 2vw, 1.5rem);
  padding: 1.25rem 1.5rem;
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  transition: transform 150ms ease-out;
}

.card:hover:not([aria-disabled='true']) {
  transform: translateY(-2px) scale(1.01);
}

.card > .title::after {
  content: '→';
  opacity: 0.6;
}

@media (prefers-color-scheme: light) {
  :root {
    --surface: #fbfbfa;
    --text: #32383f;
  }
}

@supports (backdrop-filter: blur(8px)) {
  .overlay { backdrop-filter: blur(8px) saturate(140%); }
}
`,

  html: `<!DOCTYPE html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Scalar Highlight &mdash; syntax highlighting</title>
    <link rel="stylesheet" href="/ember.css" />
  </head>
  <body>
    <!-- Navigation -->
    <nav class="site-nav" aria-label="Main">
      <a href="/" class="brand">Scalar Highlight</a>
      <ul hidden>
        <li><a href="/docs">Docs&nbsp;&rarr;</a></li>
        <li><a href="/themes" data-active="true">Themes</a></li>
      </ul>
    </nav>

    <main>
      <pre class="ch" data-lang="python"><code>print("hi")</code></pre>
    </main>
  </body>
</html>
`,

  json: `{
  "name": "@scalar/highlight",
  "version": "0.1.0",
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "./langs/*": "./dist/langs/*.js"
  },
  "engines": { "node": ">=18" },
  "keywords": ["syntax", "highlighting", "performance"],
  "budget": { "coreGzipBytes": 3072, "maxLanguageBytes": 4096 },
  "private": false,
  "funding": null
}
`,

  yaml: `name: ci
on:
  push:
    branches: [main]
  pull_request: {}

env:
  NODE_VERSION: '22'
  CI: true

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        node: [20, 22, 24]
    steps:
      - uses: actions/checkout@v4
      - name: Install
        run: npm ci
      - name: Test
        run: |
          npm run typecheck
          npm test -- --reporter=dot
      - name: Report
        if: \${{ always() }}
        run: echo "done"
`,

  sql: `-- Top referrers over the trailing week, excluding internal traffic.
WITH sessions AS (
    SELECT
        s.id,
        s.started_at,
        COALESCE(NULLIF(s.referrer_host, ''), 'direct') AS referrer,
        COUNT(e.id) FILTER (WHERE e.name = 'purchase') AS purchases
    FROM analytics.sessions AS s
    LEFT JOIN analytics.events AS e ON e.session_id = s.id
    WHERE s.started_at >= NOW() - INTERVAL '7 days'
      AND s.referrer_host NOT LIKE '%.internal'
    GROUP BY s.id, s.started_at, s.referrer_host
)
SELECT
    referrer,
    COUNT(*) AS visits,
    SUM(purchases) AS purchases,
    ROUND(100.0 * SUM(purchases) / NULLIF(COUNT(*), 0), 2) AS conversion_pct
FROM sessions
GROUP BY referrer
HAVING COUNT(*) > 25
ORDER BY visits DESC
LIMIT 20;
`,

  markdown: `# Scalar Highlight

A tiny, modular syntax highlighter. **What you import is what you ship.**

## Install

\`\`\`bash
npm install @scalar/highlight
\`\`\`

## Why another one?

- ~2 KB core, ~1 KB per language *(gzipped)*
- No runtime dependencies
- Themes are CSS, so light/dark costs nothing

> Highlight once, restyle forever.

See the [documentation](https://example.com/docs) or the [themes][themes] page.

| Library | Core | Python |
| ------- | ---: | -----: |
| Scalar Highlight | 2.3 KB | 1.7 KB |

[themes]: https://example.com/themes
`,

  diff: `diff --git a/src/core/render.ts b/src/core/render.ts
index 3f2a1b9..8c4d0e1 100644
--- a/src/core/render.ts
+++ b/src/core/render.ts
@@ -12,7 +12,11 @@ export function highlight(
-  let out = '';
-  for (const token of tokenize(code, grammar)) {
-    out += span(token);
-  }
+  // Streaming avoids allocating a token array we would immediately discard.
+  let out = '';
+  tokenize(code, grammar, (scope, start, end) => {
+    out += span(code, scope, start, end);
+  });
   return out;
 }
`,

  cpp: `// A tiny ring buffer, written the way a real header would be.
#pragma once

#include <array>
#include <cstdint>
#include <iostream>
#include <string>
#include "buffer.hpp"

#define LOG_PREFIX "[ring] "
#define CLAMP(x, lo, hi) ((x) < (lo) ? (lo) : ((x) > (hi) ? (hi) : (x)))
#define RING_ASSERT(cond, msg)                \\
  do {                                        \\
    if (!(cond)) std::cerr << (msg) << '\\n';  \\
  } while (0)

#ifdef RING_DEBUG
constexpr bool kVerbose = true;
#else
constexpr bool kVerbose = false;
#endif

namespace ring::detail {

/// Bytes we refuse to buffer past, mostly to keep the tests honest.
inline constexpr size_t MAX_BYTES = 1'048'576u;
constexpr double kGrowth = 1.5;
constexpr auto kMask = 0xFF'FFu;
constexpr int kFlags = 0b1010'0110;
constexpr int kMode = 0755;
constexpr double kEpsilon = 1e-9;
constexpr float kHalf = .5f;
constexpr unsigned long long kBig = 18'446'744'073ULL;

enum class Level : uint8_t { trace, info, error };

template <typename T, size_t N>
class Ring {
 public:
  explicit Ring(std::string_view name) : name_(name), head_(0) {}

  /** Whether anything has been pushed since the last flush. */
  [[nodiscard]] bool empty() const noexcept { return head_ == 0; }

  void push(const T& value) {
    if (head_ >= N) {
      throw std::runtime_error("ring overflow");
    }
    slots_[head_++] = value;
  }

 private:
  std::string name_;
  size_t head_;
  std::array<T, N> slots_{};
};

}  // namespace ring::detail

using namespace ring::detail;
using Bytes = std::vector<uint8_t>;

static const char* kUsage = R"(usage: ring [--verbose] "path")";
static const char* kQuery = R"sql(SELECT * FROM logs WHERE tag = "ring")sql";
static const std::string kBanner = "tab\\there, a quote \\" and \\x41\\n";
static const char kSep = '\\t';

int main(int argc, char** argv) {
  Ring<std::string, 8> ring{"main"};
  auto shout = [&ring](std::string_view text) -> std::string {
    std::string out;
    for (char c : text) out += static_cast<char>(std::toupper(c));
    ring.push(out);
    return out;
  };

  std::vector<std::string> args(argv + 1, argv + argc);
  for (const auto& arg : args) {
    if (arg == "--verbose" && kVerbose) {
      std::cout << LOG_PREFIX << shout(arg) << std::endl;
    }
  }
  RING_ASSERT(!args.empty(), "no arguments");
  printf("%-8s %#06x %.2f\\n", kUsage, kMask, kGrowth);
  return ring.empty() ? EXIT_FAILURE : 0;
}
`,

  dockerfile: `# syntax=docker/dockerfile:1.7
# check=error=true

ARG NODE_VERSION=20.14
ARG ALPINE_VERSION=3.20

FROM node:\${NODE_VERSION}-alpine\${ALPINE_VERSION} AS base
ENV PNPM_HOME="/pnpm" \\
    PATH="\${PNPM_HOME}:\${PATH}" \\
    NODE_ENV=production
WORKDIR /srv/app

FROM base AS deps
# A cache mount keeps the store between builds; a cold install costs minutes.
RUN --mount=type=cache,target=/pnpm/store,sharing=locked \\
    --mount=type=bind,source=package.json,target=package.json \\
    corepack enable && pnpm install --frozen-lockfile

FROM deps AS build
COPY --link . .
RUN <<EOF
set -eux
pnpm run build
find dist -name '*.map' -delete
EOF

FROM base AS runtime
LABEL org.opencontainers.image.source="https://github.com/scalar/highlight" \\
      org.opencontainers.image.licenses=MIT \\
      maintainer="platform@example.com"

ARG PORT
ENV PORT=\${PORT:-8080}
ENV TZ Etc/UTC

RUN --mount=type=cache,target=/var/cache/apk \\
    apk add --no-cache curl tini \\
 && addgroup -S app && adduser -S -G app app \\
 && printf 'fs.file-max = 65536\\n' > /etc/sysctl.d/99-app.conf

COPY --from=build --chown=app:app /srv/app/dist ./dist
COPY --from=deps --chmod=755 /srv/app/node_modules ./node_modules
COPY <<-'EOT' /etc/app/banner.txt
  $NOT_EXPANDED, because the opener quoted its terminator
EOT

USER app:app
EXPOSE 8080/tcp 9229
VOLUME ["/srv/app/data"]
STOPSIGNAL SIGTERM

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -fsS "http://127.0.0.1:\${PORT}/healthz" || exit 1

SHELL ["/bin/sh", "-eu", "-o", "pipefail", "-c"]
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "--enable-source-maps", "dist/server.js"]

ONBUILD COPY ./hooks /srv/app/hooks
`,

  elixir: String.raw`defmodule Warehouse.Inventory do
  @moduledoc """
  Inventory reporting, lifted out of the old Mix task so the CLI and the
  Phoenix app agree on the numbers.

  Interpolation works in here too: #{inspect(__MODULE__)}.
  """

  use GenServer
  import Enum, only: [map: 2, reduce: 3]
  alias Warehouse.{Item, Repo}
  require Logger

  @default_tags ~w(fragile bulky perishable)a
  @units ~w[kg lb]
  @sku_pattern ~r/\A[A-Z]{3}-\d{4,6}\z/u
  @banner ~s{Warehouse "inventory" report}
  @mode 0o644
  @flags 0b1010_1010
  @max_items 1_000_000
  @rate 12.5e-2
  @sep ?|
  @greeting ~c"hello"

  @type sku :: String.t()

  @doc """
  Parses one CSV line into an inventory item.
  """
  @spec parse(binary()) :: {:ok, Item.t()} | {:error, atom()}
  def parse(line) when is_binary(line) do
    case String.split(line, ~r{\s*,\s*}, parts: 3) do
      [sku, name, qty] ->
        {:ok, %Item{sku: sku, name: name, quantity: String.to_integer(qty)}}

      _other ->
        {:error, :"malformed row"}
    end
  end

  def parse(_line), do: {:error, :empty}

  defp normalise(tags), do: Enum.map(tags, &String.downcase/1)

  def report(items, opts \\ []) do
    limit = Keyword.get(opts, :limit, @max_items)

    items
    |> Enum.reject(&(&1.quantity == 0))
    |> Enum.sort_by(& &1.sku)
    |> Enum.take(limit)
    |> Enum.map_join("\n", fn %Item{} = item ->
      "#{item.sku} #{String.pad_trailing(item.name, 20)} #{format(item)}"
    end)
  end

  defp format(%Item{quantity: q} = item) when q > 0 do
    tags = item.tags |> normalise() |> Enum.join(", ")
    "x#{q} #{@sep} #{tags} #{inspect(%{sku: item.sku, mode: @mode})}"
  end

  defp format(_item), do: 'out of stock'

  @impl true
  def handle_call({:fetch, sku}, _from, state) do
    reply =
      with {:ok, raw} <- Map.fetch(state, sku),
           true <- byte_size(raw) > 0x10 do
        {:ok, raw}
      else
        :error -> {:error, :not_found}
        false -> {:error, :truncated}
      end

    {:reply, reply, state}
  end
end
`,

  graphql: `# Public API schema for the demo service.
"""
A registered user.

A description may contain a literal \\""" sequence.
"""
type User implements Node & Timestamped @key(fields: "id") {
  id: ID!
  "The name rendered in the UI."
  displayName: String!
  email: String @deprecated(reason: "Use \\"contact\\" instead.")
  posts(first: Int = 10, after: String, tags: [String!] = []): PostConnection!
  role: Role!
}

interface Node {
  id: ID!
}

union SearchResult = User | Post

enum Role {
  ADMIN
  EDITOR
  VIEWER
}

input PostFilter {
  search: String = ""
  minScore: Float = 0.5
  limit: Int = 25
  published: Boolean = true
  cursor: ID = null
}

scalar DateTime @specifiedBy(url: "https://scalars.graphql.org/datetime")

directive @auth(requires: Role = VIEWER) repeatable on FIELD_DEFINITION | OBJECT

extend type Query {
  search(filter: PostFilter): [SearchResult!]!
}

schema {
  query: Query
  mutation: Mutation
}

query FeedPage($first: Int! = 20, $cursor: ID, $withPosts: Boolean! = true) {
  viewer {
    __typename
    handle: displayName
    posts(first: $first, after: $cursor) @include(if: $withPosts) {
      edges {
        node { ...PostFields }
      }
    }
  }
}

fragment PostFields on Post {
  id
  title
  author {
    ... on User { displayName }
  }
}

mutation Publish($id: ID!) {
  publishPost(id: $id, at: 1.5e3, meta: { pinned: false, weight: -2 }) {
    ok
  }
}

subscription OnPostPublished {
  postPublished(topic: "feed\\n") { id }
}
`,

  haskell: `{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE ScopedTypeVariables #-}

-- | Inventory reporting, written to keep a Haskell highlighter honest.
--
-- Note that @-->@ and @--|@ are operators: a comment needs its dashes to be
-- followed by something that is not a symbol character.
module Inventory
  ( Item(..)
  , Catalogue
  , restock
  , tally
  ) where

import qualified Data.Map.Strict as Map
import           Data.Map.Strict (Map)
import           Data.Maybe (fromMaybe)
import           Prelude hiding (lookup)

{- A block comment that {- nests {- twice -} -} and only ends here. -}

data Item = Item
  { sku      :: String
  , quantity :: Int
  , price    :: Double
  } deriving (Eq, Show)

newtype Restock = Restock Int
  deriving (Eq, Ord, Show)

class Describable a where
  describe :: a -> String
  describe _ = "<no description>"

instance Describable Item where
  describe it = sku it ++ " x" ++ show (quantity it)

type Catalogue = Map String Item

epsilon :: Double
epsilon = 1.0e-9

maxBatch, minBatch :: Int
maxBatch = 1_000_000
minBatch = 0o17

masks :: [Int]
masks = [0xFF_FF, 0b1010, 0o777, 42]

scale :: Double
scale = 0x1.8p3

(-->) :: Bool -> Bool -> Bool
a --> b = not a || b

infixr 1 -->

describeAll :: (Describable a, Foldable t)
            => t a
            -> [String]
describeAll = foldr ((:) . describe) []

restock :: Catalogue
        -> String
        -> Int
        -> Catalogue
restock cat key n = Map.adjust bump key cat
  where
    bump it = it { quantity = quantity it + n \`div\` 2 }

tally :: [Item] -> Int
tally items = go items 0
  where
    go []         acc = acc
    go (x : xs') acc = go xs' (acc + quantity x)

banner :: String
banner = "usage: inventory \\"<file>\\"\\n\\
         \\  --verbose  print every row\\n"

bullet, newline' :: Char
bullet   = '\\8226'
newline' = '\\n'

main :: IO ()
main = do
  let cat = Map.fromList [("a-1", Item "a-1" 2 1.5)]
  case Map.lookup "a-1" cat of
    Nothing -> putStrLn "missing"
    Just it -> putStrLn (describe it)
  mapM_ (putStrLn . describe) (Map.elems cat)
  putStrLn (fromMaybe banner Nothing)
`,

  ini: `; Edge fleet configuration.
; Classic INI headers over a TOML body, which is what most .ini files are.

[owner]
name = "Amrit Kahlon"
org = 'Scalar GmbH'
dob = 1979-05-27T07:32:00-08:00

[server]
host = 127.0.0.1
port = 8080          # bind port, not the health port
enabled = true
debug = no
timeout_ms = 2_500
ratio = 0.42
scale = 1.5e-3
drift = -2E+4
mask = 0xDEAD_BEEF
umask = 0o755
flags = 0b1010_0110
ceiling = inf
floor = -nan

[server.tls]
"cert.path" = "/etc/ssl/edge.pem"
'key.path' = '/etc/ssl/edge.key'
ciphers = [ "TLS_AES_256_GCM_SHA384", "TLS_CHACHA20_POLY1305_SHA256" ]
renew.after.days = 30

[paths]
; the classic trap: separators and comment markers inside a bare value
search = /usr/local/bin:/usr/bin:/bin
query = select=1&limit=10
docs = https://example.com/guide#install
password = hunter2#not-a-comment

[banner]
motd = """
  Fleet is UP.
  timeout = 30 is not a key inside a string.
  Escaped: \\tcolumn and a \\\\ backslash.
"""
pattern = '''\\d{3}-\\d{4} stays literal, even \\n and '' inside'''

[limits]
window = 07:32:00.999
review_day = 2026-08-12
retries = [ 1, 2, 3, 5 ]
routing = { primary = "eu-west", fallback = 'us-east', weight = 0.75 }
matrix = [
  [ 1, 2 ],   # a comment inside a multi-line array
  [ 3, 4 ],
]

[[products]]
name = "Hammer"
sku = 738_594_937

[[products]]
name = "Nail"
colour = "grey"
sku = 284_758_393

[logging]
level: debug
format: json
rotate: yes
! a bang opens a comment only at the start of a line
`,

  lua: `#!/usr/bin/env lua
--- Trip statistics for one bike-share station.
--- @module trips
--- @param rows table Raw rows straight off the CSV reader.

--[[
  Durations arrive in seconds; everything downstream wants minutes, so the
  conversion happens here and nowhere else.
]]

local Trips = {}
Trips.__index = Trips

local TITLE = [[Trips ]] .. _VERSION
local USAGE = [==[
  usage: trips [[--verbose]] <path>
]==]

local ESCAPES = "tab:\\there\\9 quote:\\" newline:\\n bike:\\u{1F6B2} \\z
                 and this is still the same string"

local MAX_GAP <const> = 0x1p4
local RATES = { 0.25, 1e-3, .5, 314.16e-2, 0xA23p-4, 0X1.921FB54442D18P+1, 0xff }

function Trips.new(station, rows)
  local self = setmetatable({}, Trips)
  self.station = station
  self.rows = rows or {}
  self.total = 0
  return self
end

function Trips:add(row, ...)
  local extra = select("#", ...)
  if type(row) ~= "table" then
    error(string.format("bad row for %s", self.station), 2)
  end
  table.insert(self.rows, row)
  self.total = self.total + (row.duration_sec // 60)
  return self, extra
end

function Trips:summary()
  local counts, longest = {}, nil
  for index, row in ipairs(self.rows) do
    -- Every hundredth row is a duplicate the feed never cleaned up.
    if index % 100 == 0 then goto continue end
    local key = row.station or 'unknown'
    counts[key] = (counts[key] or 0) + 1
    if longest == nil or row.duration_sec > longest.duration_sec then
      longest = row
    end
    ::continue::
  end
  return {
    station = self.station,
    count = #self.rows,
    mean = self.total / math.max(1, #self.rows),
    tags = { "bike", "trip", ["raw:name"] = self.station },
  }
end

local function report(trips, verbose)
  local out = {}
  while true do
    local ok, err = pcall(function() return trips:summary() end)
    if not ok then
      io.stderr:write(tostring(err) .. "\\n")
      break
    end
    out[#out + 1] = ok
    if not verbose then break end
  end
  repeat
    local line = table.remove(out)
    print(--[==[ a level 2 comment keeps ]=] literal ]==] line)
  until line == nil
  return table.concat(out, ", ")
end

return { Trips = Trips, report = report, title = TITLE, usage = USAGE, gap = MAX_GAP, rates = RATES }
`,

  makefile: `# Build the widget toolkit.
# Run "make help" for the target list.

CC        ?= gcc
AR        := ar
VERSION   ::= 0.9.3
GIT_SHA   != git rev-parse --short HEAD
PREFIX    ?= /usr/local
BUILD_DIR := build
SRC_DIRS  := src \\
	src/platform
CFLAGS     = -std=c11 -Wall -Wextra
CFLAGS    += -I include -DVERSION='"$(VERSION)"'
LDLIBS    := -lm
UNAME_S   := $(shell uname -s)
SRCS      := $(foreach d,$(SRC_DIRS),$(wildcard $(d)/*.c))
OBJS      := $(patsubst %.c,$(BUILD_DIR)/%.o,$(SRCS))
DEPS      := $(OBJS:.o=.d)
export PATH := $(BUILD_DIR)/bin:\${PATH}

ifeq ($(UNAME_S),Darwin)
  CFLAGS += -DAPPLE
else ifeq ($(UNAME_S),Linux)
  CFLAGS += -pthread
endif

ifdef DEBUG
  CFLAGS += -O0 -g
else
  CFLAGS += -O2 -DNDEBUG
endif

ifneq ($(strip $(GIT_SHA)),)
  CFLAGS += -DGIT_SHA=$(GIT_SHA)
endif

define announce
	@printf '  %-8s %s\\n' "$(1)" "$(2)"
endef

include config.mk
-include $(DEPS)

.PHONY: all clean install test
.DEFAULT_GOAL := all

all: $(BUILD_DIR)/widget

$(BUILD_DIR)/widget: $(OBJS) | $(BUILD_DIR)
	$(call announce,LINK,$@)
	+$(CC) $(CFLAGS) -o $@ $^ $(LDLIBS)

$(BUILD_DIR)/%.o: %.c | $(BUILD_DIR)
	@mkdir -p $(dir $@)  # nested source trees
	@echo "compiling $* from $<"
	$(CC) $(CFLAGS) -MMD -MP -c $< -o $@

$(BUILD_DIR):
	@mkdir -p \${BUILD_DIR}

install: all
	install -d $(DESTDIR)$(PREFIX)/bin
	install -m 0755 $(BUILD_DIR)/widget $(DESTDIR)$(PREFIX)/bin

test: all
	@for t in tests/*.sh; do \\
		echo "running $$t"; \\
		sh "$$t" || exit 1; \\
	done

clean::
	-rm -rf $(BUILD_DIR)
	@-rm -f $$HOME/.widget-cache
`,

  matlab: `%% Trip store
% Utilities for summarising station data. Vectorised where it matters.
%{
Block comments sit alone on their lines. Everything in here, including
'quotes' and 100% of the percent signs, is ignored by the parser.
%}

classdef TripStore < handle & matlab.mixin.Copyable
    properties (Access = private)
        Name (1,1) string = "unnamed"
        Durations double = zeros(0, 1)
    end

    properties (Constant)
        MaxGap = 1e-3
    end

    methods
        function obj = TripStore(name, durations)
            arguments
                name (1,1) string
                durations (:,1) double = []
            end
            obj.Name = name;
            obj.Durations = durations;
        end

        function [total, counts] = tally(obj, edges)
            total = sum(obj.Durations);
            counts = histcounts(obj.Durations, edges);
            last = obj.Durations(end);
            fprintf('%s: %d trips, last %.2f min\\n', obj.Name, numel(counts), last);
        end
    end
end

function [mu, sigma] = summarise(A, varargin)
    % A' below is a transpose; 'A' would be a char array.
    label = 'A''s column means';
    msg = "she said ""go"" twice";
    mu = mean(A', 2);
    sigma = std(A(:, 1:end-1), 0, 2);
    if isempty(varargin)
        disp([label ' -> ' msg]);
    elseif ~ischar(varargin{1})
        error('summarise:badLabel', "expected a char array, got %s", class(varargin{1}));
    end
end

M = [1, 2, 3; 4, 5, 6; 7, 8, 9];
w = [0.5 1.5 2.5]';
scaled = (M .* w')' + 0x1F - 3i;
normalise = @(v) (v - min(v)) ./ max(v - min(v));
picked = arrayfun(@(k) normalise(M(:, k)), 1:size(M, 2), ...
                  'UniformOutput', false);

[~, best] = max(cellfun(@numel, picked));
store = TripStore("kendall", w);
[total, counts] = store.tally(0:10:60);

tol = .5;
while tol > 1e-6
    tol = tol / 2;
end

for k = 1:numel(picked)
    row = picked{k};
    if any(isnan(row)) || row(end) > pi
        continue
    end
    fprintf("row %d -> %s\\n", k, mat2str(row, 4));
end

switch class(store)
    case 'TripStore'
        disp('store is a TripStore');
    otherwise
        warning('unexpected class');
end
`,

  mojo: `from math import sqrt
from memory import UnsafePointer

alias TILE = 64
alias Vec4 = SIMD[DType.float32, 4]
alias EPSILON: Float64 = 1e-9

trait Reducible:
    fn reduce(self) -> Float64:
        ...

@value
@register_passable("trivial")
struct Pixel(Copyable, Movable):
    """A packed RGBA pixel.

    Escapes stay literal in a docstring: \\n is a backslash and an n.
    """

    var rgba: SIMD[DType.uint8, 4]

    @always_inline
    fn __init__(out self, r: Int, g: Int, b: Int, a: Int = 0xFF):
        self.rgba = SIMD[DType.uint8, 4](r, g, b, a)

    fn __str__(self) -> String:
        return String("#{}").format(hex(self.luma()))

    fn luma(self) -> Int:
        var acc = 0

        @parameter
        for i in range(3):
            acc += Int(self.rgba[i])
        return acc // 3

struct Matrix[dtype: DType, rows: Int, cols: Int](Reducible):
    var data: UnsafePointer[Scalar[dtype]]

    fn __init__(out self):
        self.data = UnsafePointer[Scalar[dtype]].alloc(rows * cols)

    fn __del__(owned self):
        self.data.free()

    fn reduce(self) -> Float64:
        var total: Float64 = 0.0
        for i in range(rows * cols):
            total += Float64(self.data[i])
        return total

    fn scale(inout self, factor: Scalar[dtype]) -> Self:
        for i in range(rows * cols):
            self.data[i] *= factor
        return self

    fn dot(borrowed self, other: Self) -> Float64:
        return sqrt(self.reduce() * other.reduce())

fn load_mask(path: String) raises -> List[Int]:
    var mask = List[Int]()
    with open(path, "r") as handle:
        for line in handle.read().split("\\n"):
            if not line:
                continue
            mask.append(Int(line))
    return mask

fn describe[T: Stringable](read value: T, mut log: String, out ok: Bool):
    log += String("value={}").format(str(value))
    ok = True

async fn fetch(owned url: String) -> String:
    return await get(url)

def main():
    var flags = 0b1010_1101
    var mode = 0o755
    var scale = 6.022_140e23
    var p = Pixel(0x1F, 12, 255)
    print(f"luma={p.luma()} flags={flags:#x} scale={scale}")
    var m = Matrix[DType.float32, 4, 4]()
    var log = String()
    var ok = False
    describe(TILE, log, ok)
    if m.scale(2.5).reduce() > EPSILON and not flags == mode:
        print("scaled", m.dot(m), sep=", ")
    consume(log^)
`,

  nginx: `# /etc/nginx/nginx.conf — edge proxy for the docs site
user                 www-data;
worker_processes     auto;
error_log            /var/log/nginx/error.log warn;
pid                  /run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
}

http {
    include            /etc/nginx/mime.types;
    default_type       application/octet-stream;
    sendfile           on;
    keepalive_timeout  65s;
    client_max_body_size 10m;
    gzip on;

    log_format main '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent "\${http_referer}"';
    access_log /var/log/nginx/access.log main;

    map $http_upgrade $connection_upgrade {
        default    upgrade;
        ''         close;
        ~*^polling close;
    }

    upstream docs_backend {
        least_conn;
        server 10.0.0.11:8080 weight=5 max_fails=3 fail_timeout=30s;
        server 10.0.0.12:8080 backup;
        keepalive 32;
    }

    server {
        listen      80 default_server;
        listen      [::]:80;
        server_name example.com *.docs.example.com;
        return      301 https://$host$request_uri;
    }

    server {
        listen              443 ssl http2;
        server_name         docs.example.com;
        ssl_certificate     /etc/letsencrypt/live/docs/fullchain.pem;
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_session_timeout 1d;
        root                /srv/www/docs;

        if ($request_method !~ ^(GET|HEAD|POST)$) {
            return 405;
        }

        if (-f $document_root/maintenance.html) {
            return 503;
        }

        location = /healthz {
            access_log off;
            return 200 "ok\\n";
        }

        location ^~ /assets/ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        location ~* \\.(?:css|js|png|jpe?g|woff2)$ {
            expires 7d;
            try_files $uri =404;
        }

        location ~ ^/api/v[0-9]{1,2}/(.*)$ {
            proxy_pass         http://docs_backend/$1;
            proxy_http_version 1.1;
            proxy_set_header   Host       $host;
            proxy_set_header   Upgrade    $http_upgrade;
            proxy_set_header   Connection $connection_upgrade;
            proxy_set_header   X-Trace-Id "\${request_id}";
            proxy_read_timeout 60s;
        }

        location / {
            try_files $uri $uri/ /index.html;
        }

        rewrite ^/docs/v{1,2}/(.*)$ /$1 permanent;
        rewrite "^/legacy;path$" /new break;

        error_page 500 502 503 504 /50x.html;
    }
}
`,

  perl: String.raw`#!/usr/bin/env perl
use strict;
use warnings;
use v5.36;
use POSIX qw(floor);

package Warehouse::Item;

=head1 NAME

Warehouse::Item - one row per SKU, parsed out of the nightly export.

=cut

our $VERSION     = '2.4.0';
my $SKU_RE       = qr/\A[A-Z]{3}-\d{4,6}\z/;
my $BANNER       = q{Warehouse "inventory" report};
my @DEFAULT_TAGS = qw(fragile bulky perishable);
my %UNIT_OF      = (kg => 'metric', lb => 'imperial');
my $RATE         = 1_250.75e-2;    # cents per unit, not dollars
my $MASK         = 0b1010_1010;
my $PERMS        = 0644;
my $LIMIT        = 0xFF_FF;
my $TAGLINE      = qq[$BANNER, rev $VERSION];

sub new {
    my ($class, %args) = @_;
    my $self = {
        sku      => $args{sku},
        name     => $args{name} // 'unknown',
        quantity => $args{quantity} || 0,
        tags     => [@DEFAULT_TAGS],
    };
    return bless $self, $class;
}

sub parse {
    my ($class, $line) = @_;
    return unless defined $line && length $line;

    chomp $line;
    my @parts = split /\s*,\s*/, $line, 3;
    die "bad row: $line\n" unless $parts[0] =~ $SKU_RE;

    (my $name = $parts[1]) =~ s{^ +| +$}{}g;
    $name =~ tr/A-Z/a-z/;

    return $class->new(sku => $parts[0], name => $name, quantity => $parts[2]);
}

sub density {
    my ($self, $volume) = @_;
    # A slash after a closing brace divides; it never opens a pattern.
    my $each = $self->{quantity} / $volume;
    return $each % $LIMIT;
}

sub summary {
    my $self  = shift;
    my $count = scalar @{$self->{tags}};

    printf "%-12s %s (%d of %d)\n", $self->{sku}, $self->{name}, $count, $#DEFAULT_TAGS + 1;
    print STDERR "no tags on ${D}{count} rows\n" if $count == 0;
    return sprintf('%s %s', $self->{sku}, $BANNER x 2);
}

sub report {
    my (@items) = @_;
    local $, = "\t";
    my $handler = \&summary;
    my %seen;

    foreach my $item (sort { $a->{sku} cmp $b->{sku} } @items) {
        next if $item->{name} =~ m/^test-/;
        $seen{ $item->{sku} } = $handler->($item) . "\n";
    }

    my $header = <<"HEADER";
$BANNER built at @{[ scalar localtime ]}
HEADER

    my $legend = <<'LEGEND';
$totals and @columns stay literal in this block
LEGEND

    my $footer = <<~FOOTER;
        rows:  ${D}{\ scalar @items }
        perms: $PERMS
        FOOTER

    return join "\n", $header, values %seen, $legend, $footer;
}

print &report(map { Warehouse::Item->parse($_) } <STDIN>);

__END__

Fixture rows live below the marker and are never parsed as code.
ABC-1234, widget, 12
`,

  scala: `package com.example.catalog

import scala.annotation.tailrec
import scala.collection.mutable.{ArrayBuffer, Map => MutableMap}

/** Prices a catalogue of items.
  *
  * Block comments nest: /* this inner one closes here */ and the lines after
  * it are still documentation rather than code.
  */
object Catalog {
  val TaxRate: Double = 0.0825
  final val MaxItems = 1_000
  private val HexMask = 0xff_ff
  private val Epsilon = 1.5e-3f
  private val Ratio = 2.5d
  private val Retries = 3L

  type Result[A] = Either[String, A]

  enum Currency {
    case USD, EUR, JPY
  }

  sealed trait Event
  case class Restocked(sku: String, by: Int) extends Event
  case object Closed extends Event

  case class Item(sku: String, qty: Int = 0, priceCents: Long = 250L, currency: Currency = Currency.USD) {
    def total: Long = qty * priceCents
    def +:(other: Item): List[Item] = List(this, other)
  }

  given itemOrdering: Ordering[Item] = Ordering.by(_.sku)
  implicit val defaultCurrency: Currency = Currency.EUR

  extension (item: Item) def label: String = s"\${item.sku} x \${item.qty}"

  // A context bound is sugar for one more implicit parameter list.
  def cheapest[A: Ordering](values: Seq[A]): Option[A] = values.sorted.headOption

  def widen[A <: Item](xs: ArrayBuffer[A]): Seq[Item] = Seq(xs.toSeq: _*)

  def render(items: List[Item])(using ord: Ordering[Item]): String =
    items.sorted
      .map { item =>
        f"\${item.label}%-20s \${item.total / 100.0}%.2f"
      }
      .mkString("\\n")

  @tailrec
  final def countdown(n: Int, acc: List[Int] = Nil): List[Int] =
    if (n <= 0) acc else countdown(n - 1, n :: acc)

  def describe(event: Event): String = event match {
    case Restocked(sku, by) if by > 10 => s"bulk restock of $sku"
    case Restocked(sku, _)             => raw"restock\\tof $sku"
    case Closed                        => "closed"
  }

  def summarise(items: Seq[Item]): String = {
    val header =
      """|sku      qty
         |-------- ---""".stripMargin
    val ids = for {
      item <- items
      if item.qty > 0
    } yield item.sku
    val counts = MutableMap.empty[String, Int]
    items.foreach(item => counts(item.sku) = item.qty)
    println(header + ids.mkString(", "))
    header
  }

  val \`total value\` = List(Item("abc")).map(_.total).sum
  val marker = 'ok
  val initial = 'a'
  val escaped = "tab:\\there \\u2014 done"
}
`,
  c: String.raw`/**
 * Fixed-capacity ring buffer.
 *
 * The capacity has to be a power of two - that is what turns the wrap-around
 * into a mask instead of a modulo.
 */
#include <stdio.h>
#include <stdlib.h>
#include "ring.h"

#define RING_CAP 1024u
#define MIN(a, b) ((a) < (b) ? (a) : (b))
#define LOG(fmt, ...) \
    fprintf(stderr, "[%s:%d] " fmt "\n", __FILE__, __LINE__, __VA_ARGS__)

#ifndef NDEBUG
#  define TRACE(msg) fputs(msg, stderr)
#else
#  define TRACE(msg) ((void)0)
#endif

typedef enum { RING_OK = 0, RING_FULL = -1 } ring_status;

typedef struct ring {
    unsigned char *data;  /* storage, owned by the ring */
    size_t head, tail, cap;
    int (*on_drop)(struct ring *self, unsigned char byte);
} ring_t;

static const char *const STATUS_NAMES[] = { "ok", "full" };

/* A '\0' terminator isn't written here - the caller doesn't own the tail. */
static size_t ring_used(const ring_t *r)
{
    return (r->head - r->tail) & (r->cap - 1);
}

ring_t *ring_new(size_t cap)
{
    ring_t *r = calloc(1, sizeof(*r));
    if (r == NULL)
        return NULL;
    r->data = malloc(cap);
    r->cap = cap;
    r->head = r->tail = 0;
    return r;
}

int ring_push(ring_t *r, unsigned char byte)
{
    if (ring_used(r) + 1 >= r->cap) {
        if (r->on_drop != NULL && r->on_drop(r, byte) == 0)
            goto store;
        return RING_FULL;
    }
store:
    r->data[r->head] = byte;
    r->head = (r->head + 1) & (r->cap - 1);
    return RING_OK;
}

int main(void)
{
    static const double ratios[] = { 0.5, 1e-3, 0x1p-3, 3.14f };
    const char *note = "escape \t \"quoted\" \x41 and a /* not a comment */";
    const char *home = "https://scalar.com/docs#c";  // the // in there is data
    const wchar_t *wide = L"wide\u00e9";
    char sep = '\'', quote = '"', nul = '\0';
    unsigned long mask = 0xDEADBEEFUL, perms = 0755, half = 42UL / 2;

    ring_t *r = ring_new(RING_CAP);
    if (r == NULL) {
        perror("ring_new");
        return EXIT_FAILURE;
    }
    for (int i = 0; i < (int)MIN(RING_CAP, 8); i++)
        ring_push(r, (unsigned char)('a' + i));

    printf("used=%zu mask=%#lx ratio=%.3f sep=%c%s%s\n",
           ring_used(r), mask, ratios[0], sep, STATUS_NAMES[0], note);
    LOG("perms=%lo half=%lu quote=%c home=%s", perms, half, quote, home);
    free(r->data);
    free(r);
    return 0;
}
`,
  clojure: `#!/usr/bin/env bb
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
`,
  csharp: `#nullable enable
using System;
using System.Collections.Generic;
using System.Text.Json;
using static System.Math;

namespace Acme.Billing;

/// <summary>Totals and renders invoices.</summary>
/// <remarks>Rates are per region.</remarks>
[ApiController]
[Route("api/[controller]")]
public sealed partial class InvoiceService : IInvoiceService
{
    private const decimal DefaultRate = 0.0825m;
    private const int Mask = 0b1010_0000 | 0xFF;
    private const long Ceiling = 9_000_000L;
    private const double Epsilon = 1e-9;
    private const float Half = .5f;

    private static readonly int[] Retries = { 1, 2, 5 };
    private readonly Dictionary<string, decimal> _rates = new();
    private readonly ILogger? _logger;

    /* A verbatim string keeps its backslashes; "" is its only escape. */
    private readonly string _template = @"C:\\reports\\""summary"".txt";

    public InvoiceService(IClock clock, ILogger? logger = null)
    {
        Clock = clock;
        _logger = logger;
    }

    public IClock Clock { get; init; }
    public int Count => _rates.Count;

    public async Task<string> RenderAsync(Invoice invoice, CancellationToken token = default)
    {
        Validate(invoice);

        var lines = new List<string>();
        foreach (var item in invoice.Items)
        {
            decimal net = item.Price * item.Quantity;
            lines.Add($"{item.Name,-20}{net,10:C2}\\t{item.Sku}");
        }

        var total = invoice.Items.Sum(i => i.Price) * (1m + DefaultRate);
        var label = invoice.State switch
        {
            InvoiceState.Paid => "paid",
            InvoiceState.Open when total > 1_000m => "large",
            _ => throw new ArgumentOutOfRangeException(nameof(invoice)),
        };

        _logger?.Log($@"wrote {lines.Count} line(s) to ""{_template}""");
        await File.WriteAllTextAsync(_template, string.Join('\\n', lines), token);
        return $"{label}: {total:N2} ({Retries.Length} retries)";
    }

    private static void Validate(Invoice invoice)
    {
        if (invoice is null or { Items.Count: 0 })
        {
            throw new ArgumentException("empty invoice", nameof(invoice));
        }
    }

    // Raw literals hold quotes verbatim, so no escaping is needed here.
    public static string Schema() => """
        { "kind": "invoice", "version": 3 }
        """;

    private static bool IsHex(char c) => c is (>= '0' and <= '9') or (>= 'a' and <= 'f');

#if DEBUG
#pragma warning disable CS1591
    private void Trace(string message) => Console.WriteLine($"[{DateTime.UtcNow:o}] {message}");
#endif
}
`,
  dart: `#!/usr/bin/env dart
import 'dart:convert' show jsonDecode;
import 'package:meta/meta.dart' as meta;

/// Everything we know about one item on the shelf.
///
/// Doc comments are \`///\`; ordinary notes use \`//\`.
@meta.immutable
class Item {
  const Item({required this.sku, required this.price, this.tags = const <String>[]});

  final String sku;
  final double price;
  final List<String> tags;

  /* Superseded by [describe]. /* Including this older note. */ Kept for now. */
  static const int maxTags = 8;
  static const double taxRate = 0.0825;
  static const int oneMillion = 1_000_000;
  static const int pageSize = 0x20;
  static const double epsilon = 1.5e-9;

  factory Item.fromJson(Map<String, dynamic> json) => Item(
        sku: json['sku'] as String,
        price: (json['price'] as num).toDouble(),
        tags: <String>[...?json['tags'], 'restocked'],
      );

  bool get isOnSale => price < 10.0;

  String? describe({bool loud = false}) {
    if (tags.isEmpty) return null;
    final label = '$sku (\${tags.length} tags): \\$\${price.toStringAsFixed(2)}';
    return loud ? label.toUpperCase() : label;
  }

  @override
  String toString() => 'Item($sku)';
}

enum Shelf { cold, dry, frozen }

final RegExp skuPattern = RegExp(r'^[A-Z]{3}-\\d{4}$');

Future<List<Item>> loadItems(String payload) async {
  final decoded = jsonDecode(payload) as List<dynamic>;
  return [
    for (final entry in decoded)
      if (entry is Map<String, dynamic>) Item.fromJson(entry),
  ];
}

void main() async {
  final report = StringBuffer()
    ..writeln('inventory')
    ..writeln('=' * 9);

  final items = await loadItems('[]');
  final byShelf = <Shelf, List<Item>>{};
  for (final item in items) {
    byShelf[Shelf.dry] ??= <Item>[];
    report.write('''
  \${item.sku}: \${item.price.toStringAsFixed(2)}
  on sale: \${item.isOnSale}
''');
  }

  print('\${byShelf.length.toString()} shelves, \${1.toString()} pass');
  print(r'raw: $notInterpolated and \\n stay literal');
}
`,
  fsharp: `namespace Contoso.Inventory

open System
open System.Collections.Generic

#nowarn "40"

/// A stock keeping unit. Prices are whole cents so no float drift creeps in.
type Sku =
    { Code: string
      Label: string
      Cents: int64
      Tags: Set<string> }

type Movement =
    | Received of qty: int * at: DateTime
    | Shipped of qty: int
    | Adjusted of delta: int * reason: string

exception OutOfStock of sku: string

[<Literal>]
let MaxBatch = 10_000

let private rates = dict [ "usd", 1.0m; "eur", 0.92m ]

/// Kept inline so the arithmetic stays generic over ^T.
let inline square (x: ^T) = x * x

let (|Empty|NonEmpty|) (xs: 'a list) =
    match xs with
    | [] -> Empty
    | _ -> NonEmpty xs

let describe (sku: Sku) (count: int) =
    let name = sku.Label.Trim()
    let qty' = max count 0
    $"{name}: %d{qty'} @ %.2f{float sku.Cents / 100.0}"

let rec applyAll (stock: Map<string, int>) moves =
    match moves with
    | [] -> stock
    | Received (qty, _) :: rest -> applyAll (Map.add "in" qty stock) rest
    | Shipped qty :: rest when qty > 0 -> applyAll stock rest
    | _ :: rest -> applyAll stock rest

type Ledger(name: string) =
    let entries = ResizeArray<Movement>()
    member val Owner = name with get, set
    member this.Add(m: Movement) =
        entries.Add m
        this
    member _.Count = entries.Count
    override this.ToString() = sprintf "Ledger(%s, %d)" this.Owner entries.Count

module Report =
    let header = @"sku,""qty"",value"
    let query =
        """
        SELECT sku, qty FROM stock WHERE qty < 10
        """
    let \`\`rows written\`\` = ref 0

    let target (root: string) = $@"{root}\\inventory.csv"

    let write (path: string) (rows: seq<string>) =
        use writer = IO.File.CreateText path
        for row in rows do
            writer.WriteLine row
            incr \`\`rows written\`\`
        printfn "wrote %i rows to %s" !\`\`rows written\`\` path

[<EntryPoint>]
let main argv =
    let hex, bits, big = 0xFFu, 0b1010y, 1_000_000L
    let ratio = 3.5e-2f
    let mul, add = (*), (+)
    let bullet = 'µ'
    let mid' = if bullet = 'µ' then 1 else 0
    let escaped = "tab\\there \\u00A9 2024\\n"
    (* a block comment (* nests *) all the way *)
    printfn "%A" (mul hex 2u, add 1 2, bits, big, ratio, mid', escaped)
    if argv.Length = 0 then 1 else 0
`,
  http: `# Example session against the billing API.

### Create a customer
POST /v1/customers?expand=subscriptions&locale=en-US&dry_run HTTP/1.1
Host: api.example.com:8443
Content-Type: application/json; charset=utf-8
Accept: application/json, text/plain;q=0.9, */*;q=0.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.abc
If-None-Match: "33a64df551425fcc55e"
Content-Length: 348

{
  "name": "Ada \\"Countess\\" Lovelace",
  "note": "first line\\nsecond line, with a \\u00e9 escape",
  "balance": -1250,
  "discount": 0.075,
  "credit_limit": 1.2e4,
  "retries": 3,
  "active": true,
  "deleted_at": null,
  "tags": ["vip", "beta"],
  "address": {
    "line1": "1 Infinite Loop",
    "postal_code": "95014"
  }
}

HTTP/1.1 201 Created
Date: Mon, 06 Jan 2026 15:04:05 GMT
Content-Type: application/json
Location: https://api.example.com/v1/customers/cus_00042
Cache-Control: no-store, max-age=0
Set-Cookie: session=a3fWa; Path=/; Expires=Wed, 21 Oct 2026 07:28:00 GMT; HttpOnly
Content-Length: 96

{
  "id": "cus_00042",
  "object": "customer",
  "created": 1767711845,
  "livemode": false
}

### Fetch it back
GET /v1/customers/cus_00042 HTTP/2
Host: api.example.com
Accept: */*

### The failure shape, for reference
// A 404 body is problem+json, not the customer object.
HTTP/1.1 404 Not Found
Content-Type: application/problem+json
Content-Length: 74

{"type": "https://example.com/probs/missing", "title": "No such customer"}
`,
  java: String.raw`package com.example.orders;

import java.util.List;
import java.util.Map;
import static java.util.stream.Collectors.joining;

/**
 * Prices orders and renders receipts.
 *
 * @param <T> the line-item type this service prices
 */
@Service(name = "orders", eager = true)
public final class OrderService<T extends LineItem> implements Pricing {

    /** Widest column a rendered receipt line may use. */
    private static final int MAX_WIDTH = 72;
    private static final long CACHE_TTL = 30_000L;
    private static final double TAX_RATE = 0.0825d;
    private static final float ROUNDING = .5f;
    private static final double EPSILON = 1e-9;
    private static final int MASK = 0xFF_FF;
    private static final int FLAGS = 0b1010_0011;
    private static final char BULLET = '•';

    /* Quotes, slashes and percent signs inside a text block are all literal. */
    private static final String TEMPLATE = """
            Order "%s" // still text, not a comment
              total: %,.2f%n""";

    private final Map<String, List<T>> itemsByCustomer;
    private int rendered = 0;

    public OrderService(Map<String, List<T>> itemsByCustomer) {
        this.itemsByCustomer = itemsByCustomer;
    }

    @Override
    public Money priceOf(String customer, T... extras) throws PricingException {
        List<T> items = itemsByCustomer.getOrDefault(customer, List.of());
        double subtotal = items.stream().mapToDouble(LineItem::amount).sum();
        for (T extra : extras) {
            subtotal += extra.amount();
        }
        if (subtotal < EPSILON) {
            throw new PricingException("no charge for \"" + customer + '\'');
        }
        return new Money(subtotal * (1 + TAX_RATE));
    }

    static String describe(Status status) {
        return switch (status) {
            case DRAFT -> "draft";
            case SETTLED, VOIDED -> {
                String label = status.name().toLowerCase();
                yield label.strip();
            }
            default -> throw new IllegalStateException("unknown: " + status);
        };
    }

    public String render(Object value) {
        rendered++;
        if (value instanceof Money money && money.amount() > ROUNDING) {
            return TEMPLATE.formatted("total", money.amount());
        }
        try {
            return String.format("%-8s|%08X", value, MASK).substring(0, MAX_WIDTH);
        } catch (RuntimeException e) {
            return List.of("?", "!").stream().collect(joining());
        } finally {
            System.out.println(BULLET);
        }
    }
}

record LineItem(String sku, double amount) {}

enum Status { DRAFT, SETTLED, VOIDED }
`,
  kotlin: `@file:JvmName("Inventory")

package com.example.shop

import kotlin.math.roundToInt

/**
 * Tracks what is on the shelves.
 *
 * Block comments nest: /* this inner one closes here */ and the lines after it
 * are still documentation rather than code.
 */
const val TAX_RATE = 0.0825
private const val MAX_ITEMS: Int = 1_000
private const val HEX_MASK = 0xFF_FFu
private const val FLAGS = 0b1010_1010
private const val EPSILON = 1.5e-3f

enum class Currency { USD, EUR, JPY }

data class Item(
    val sku: String,
    var quantity: Int = 0,
    val priceCents: Long = 250L,
    val currency: Currency = Currency.USD,
)

sealed interface Event {
    data class Restocked(val sku: String, val by: Int) : Event
    object Closed : Event
}

class Inventory(private val items: MutableList<Item> = mutableListOf()) {
    companion object {
        val SKU_PATTERN = Regex("""^[A-Z]{3}-\\d{4}$""")
        const val SEPARATOR = '-'
    }

    val total: Int
        get() = items.sumOf { it.quantity }

    fun add(item: Item): Boolean {
        if (items.size >= MAX_ITEMS || !SKU_PATTERN.matches(item.sku)) return false
        items.add(item)
        return true
    }

    fun restock(sku: String, amount: Int = 1) {
        items.firstOrNull { it.sku == sku }?.let { found ->
            found.quantity += amount
            println("Restocked \${found.sku} by $amount")
        } ?: error("no such sku: \\"$sku\\"")
    }

    fun report(): String = buildString {
        append("Inventory \\u2014 \${items.size} lines\\n")
        outer@ for (item in items) {
            if (item.quantity == 0) continue@outer
            val price = item.priceCents / 100.0
            append("$item.sku\\t\${"%.2f".format(price)} x \${item.quantity}\\n")
        }
    }
}

fun String.slugify(separator: Char = '-'): String =
    lowercase().map { if (it.isLetterOrDigit()) it else separator }.joinToString("")

fun describe(event: Event): String = when (event) {
    is Event.Restocked -> "restocked \${event.by} unit\${if (event.by == 1) "" else "s"}"
    Event.Closed -> "closed"
}

fun \`reports an empty inventory\`() {
    val inventory = Inventory()
    check(inventory.total == 0) { "expected 0, got \${inventory.total}" }
}
`,
  objectivec: String.raw`//
//  ImageCache.m
//  Written to exercise the grammar, not to compile.
//

#import <Foundation/Foundation.h>
#import "ImageCache.h"

#define kMaxRetries 3
#pragma mark - Constants

/** Posted once a fetch settles, successfully or not. */
NSString *const ScalarCacheDidUpdateNotification = @"ScalarCacheDidUpdate";

static const NSTimeInterval kTimeout = 12.5;
static const NSUInteger kDefaultCapacity = 0x40;
static const double kEpsilon = 1e-9;
static const char kSeparator = '\n';

typedef NS_ENUM(NSInteger, ScalarCacheState) {
    ScalarCacheStateIdle = 0,
    ScalarCacheStateLoading = 1 << 1,
    ScalarCacheStateFailed = 0b100,
};

@interface ImageCache () <NSURLSessionDelegate>

@property (nonatomic, strong, readonly) NSMutableDictionary<NSString *, UIImage *> *entries;
@property (nonatomic, assign, getter=isSuspended) BOOL suspended;

@end

@implementation ImageCache

+ (instancetype)sharedCache {
    static ImageCache *shared = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        shared = [[self alloc] init];
    });
    return shared;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        _entries = [NSMutableDictionary dictionaryWithCapacity:kDefaultCapacity];
        _suspended = NO;
    }
    return self;
}

- (nullable UIImage *)imageForKey:(NSString *)key retries:(NSInteger)retries {
    if (key.length == 0 || retries > kMaxRetries) {
        return nil;
    }

    UIImage *cached = self.entries[key];
    if (cached != nil) {
        NSLog(@"cache hit for \"%@\" after %ld tries", key, (long)retries);
        return cached;
    }

    @try {
        NSDictionary *info = @{ @"key": key, @"retries": @(retries), @"eager": @YES };
        [[NSNotificationCenter defaultCenter] postNotificationName:ScalarCacheDidUpdateNotification
                                                            object:self
                                                          userInfo:info];
    } @catch (NSException *exception) {
        [self handleFailure:exception];
    } @finally {
        self.suspended = NO;
    }

    return [self imageForKey:key retries:retries + 1];
}

- (void)handleFailure:(NSException *)exception {
    SEL selector = @selector(imageForKey:retries:);
    if ([self respondsToSelector:selector]) {
        [self performSelector:selector withObject:@"retry" withObject:@0];
    }
}

@end
`,
  ocaml: `(* inventory.ml — a store, written to keep a highlighter honest.
   Comments (* nest *), so a scanner has to count them and this one
   only ends here. *)

(** [Inventory] tracks stock levels. Doc comments get their own scope. *)

open Printf
module StringMap = Map.Make (String)

exception Out_of_stock of string

type 'a tree =
  | Leaf
  | Node of 'a tree * 'a * 'a tree

type item = {
  sku : string;
  qty : int;
  price : float;
  tags : [ \`Fragile | \`Bulk of int ] list;
}
[@@deriving show, eq]

module type STORE = sig
  type t

  val empty : t
  val default_label : string
  val add : string -> int -> t -> t
end

let epsilon = 1e-9
let max_batch = 1_000_000
let mask = 0xFF_FF land 0o777 lxor 0b1010
let big = 42L and small = 7l and native = 0xDEADn
let scale = 0x1.8p3

(* An identifier may end in a quote, so [acc'] never opens a char literal. *)
let rec fold_tree f acc = function
  | Leaf -> acc
  | Node (l, v, r) ->
      let acc' = fold_tree f acc l in
      fold_tree f (f acc' v) r

let escape_char = function
  | '\\n' -> "\\\\n"
  | '\\t' -> "\\\\t"
  | '\\\\' -> "\\\\\\\\"
  | '\\255' -> "\\\\255"
  | c -> String.make 1 c

let usage = {|
  usage: inventory [--verbose] "<file>"
  nothing in here is escaped, not even \\n
|}

let normalize s = String.trim (String.lowercase_ascii s)

let describe ?(verbose = false) ~label (it : item) : string =
  let tag_count = List.length it.tags in
  if verbose then
    sprintf "%-10s x%04d @ %.2f (%d tags) [%s]%!" it.sku it.qty it.price tag_count label
  else sprintf "%s\\t%d" it.sku it.qty

let restock (stock : int StringMap.t) ~sku ~qty =
  match StringMap.find_opt sku stock with
  | None -> raise (Out_of_stock sku)
  | Some have when have + qty > max_batch -> invalid_arg "batch too large"
  | Some have -> StringMap.add sku (have + qty) stock

let total items =
  List.fold_left (fun acc it -> acc +. (float_of_int it.qty *. it.price)) 0. items

let () =
  let stock = ref StringMap.empty in
  for i = 1 to 3 do
    stock := StringMap.add (sprintf "sku-%d" i) (i * 10) !stock
  done;
  let sample = { sku = "a-1"; qty = 2; price = 1.5; tags = [ \`Fragile; \`Bulk 12 ] } in
  print_endline (describe ~verbose:true ~label:"demo" (normalize sample));
  printf "total = %.2f\\n%!" (total [ sample ])
`,
  php: `<?php

declare(strict_types=1);

namespace App\\Billing;

use App\\Models\\Invoice;
use RuntimeException;

const MAX_ITEMS = 100;

/**
 * Totals an order and renders its receipt.
 */
#[Immutable]
final class Receipt implements Renderable
{
    private const TAX_RATE = 0.0825;

    public function __construct(
        private readonly Invoice $invoice,
        private array $lines = [],
    ) {
    }

    // Rows come off the wire untrusted, so nothing here trusts a key.
    public static function fromArray(array $rows): self
    {
        $receipt = new self(Invoice::blank());
        foreach ($rows as $index => $row) {
            $receipt->lines[] = $row;
        }

        return $receipt;
    }

    public function total(): int
    {
        $sum = 0;
        # A hash comment, still legal and still in old code.
        foreach ($this->lines as $line) {
            $sum += (int) round($line['price'] * $line['qty']);
        }

        return $sum + (int) ($sum * self::TAX_RATE);
    }

    public function render(string $currency = 'usd'): string
    {
        $name = $this->invoice->customer;
        $flags = 0xFF | 0b1010 | 0o17 | 017;
        $limit = 1_000_000;
        $ratio = 1.5e3;
        $escaped = "Tab:\\t \\"{$name}\\" owes \\$5 /* not a comment */";
        $plain = 'No $interpolation, and here\\'s the proof';

        $sql = <<<SQL
            SELECT * FROM invoices
            WHERE customer = '{$name}' AND total > $limit
            SQL;

        $notice = <<<'TEXT'
            $name stays literal, and so does \\n.
            TEXT;

        if (!isset($this->lines[0])) {
            throw new RuntimeException("empty receipt for {$name}");
        }

        return sprintf('%s: %d', $name, $this->total()) . $sql . $notice . $escaped . $plain . $currency;
    }
}
?>
<div class="receipt" data-total="<?= $receipt->total() ?>">
  <h1>Receipt for <?php echo htmlspecialchars($name); ?></h1>
  <!-- rendered by App\\Billing\\Receipt -->
</div>
`,
  powershell: `#Requires -Version 7.0
<#
.SYNOPSIS
    Collects widget reports and writes a summary.
.PARAMETER Path
    Folder to scan. Wildcards are allowed.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateNotNullOrEmpty()]
    [string]$Path,

    [ValidateSet('json', 'csv')]
    [string]$Format = 'json',

    [int]$MaxItems = 0x1F,

    [switch]$Force
)

using namespace System.IO

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

enum Severity {
    Info = 0
    Warning = 1
}

class Widget {
    [string]$Name
    [double]$Weight

    Widget([string]$name) {
        $this.Name = $name
        $this.Weight = 1.5e3
    }
}

function Get-Widget {
    [CmdletBinding()]
    param([string]$Root = $env:WIDGET_HOME)

    $threshold = 10kb
    $mask = 0b1010
    foreach ($file in Get-ChildItem -Path $Root -Filter '*.json' -Recurse) {
        if ($file.Length -gt $threshold -and $file.Name -notmatch '^\\.') {
            Write-Verbose "Reading \`"$($file.FullName)\`" -- $($file.Length) bytes\`n"
            $data = Get-Content -Path $file.FullName -Raw | ConvertFrom-Json
            [Widget]::new($data.name)
        }
        elseif ($Force -or $mask -band 2) {
            Write-Warning ('Skipped {0}' -f $file.Name)
        }
    }
}

$widgets = Get-Widget -Root $Path -Verbose:$false |
    Where-Object { $_.Weight -ge 1.0 } |
    Sort-Object -Property Name -Descending |
    Select-Object -First ($MaxItems + 1)

$report = @"
Widgets:   $($widgets.Count)
Home:      \${env:WIDGET_HOME}
Escaped:   \`$notAVariable and a tab\`t
"@

$literal = @'
No $interpolation and no \`escapes in here.
'@

if ($widgets.Count -eq 0) {
    throw [System.IO.FileNotFoundException]::new("no widgets under '$Path'")
}
else {
    $report | Out-File -FilePath "$Path\\report.$Format" -Encoding utf8
    Write-Host "Wrote $($widgets.Count) widgets" -ForegroundColor Green
}

exit 0
`,
  r: `library(stats)
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
`,
  ruby: String.raw`#!/usr/bin/env ruby
# frozen_string_literal: true

=begin
Inventory reporting, lifted out of the old rake task so the CLI and the web
app agree on the numbers.
=end

require 'json'
require_relative 'support/logger'

module Warehouse
  VERSION = '2.4.0'
  DEFAULT_TAGS = %w[fragile bulky perishable].freeze
  UNITS = %i[kg lb].freeze
  SKU_PATTERN = /\A[A-Z]{3}-\d{4,6}\z/
  BANNER = %q{Warehouse "inventory" report}
  MODE = 0o644
  RATE = 1_250.75e-2

  class Item
    attr_reader :sku, :name
    attr_accessor :quantity

    def initialize(sku, name, quantity = 0, tags: DEFAULT_TAGS)
      @sku = sku
      @name = name
      @quantity = quantity
      @tags = tags
      @@count += 1
    end

    def self.parse(line)
      return nil if line.strip.empty?

      sku, name, qty = line.split(/\s*,\s*/, 3)
      raise ArgumentError, "bad sku: #{sku}" unless sku =~ SKU_PATTERN

      new(sku, name, Integer(qty || 0))
    end

    def category
      case @name
      when /\Afrozen/i then :cold
      else :ambient
      end
    end

    def empty?
      quantity.zero?
    end

    def <=>(other)
      sku <=> other.sku
    end

    def to_s
      "#{@name} (#{@sku}) #{empty? ? 'out of stock' : "x#{@quantity}"}"
    end
  end

  class Report
    SEPARATOR = ?|

    def initialize(items)
      @items = items.sort
      @printed_at = Time.now
    end

    def render(io = $stdout)
      io.puts "#{BANNER}\n\n"
      @items.reject(&:empty?).each do |item|
        io.puts format('%-12s %s', item.sku, item.name)
      end
      io.puts "total: #{@items.sum { |i| i.quantity }} units, avg #{total / @items.size}"
    end

    private

    def header
      <<~TEXT.strip
        Inventory as of #{@printed_at.strftime('%Y-%m-%d')}
        #{SEPARATOR * 40}
      TEXT
    end
  end
end

if __FILE__ == $0
  items = ARGF.readlines.map { |line| Warehouse::Item.parse(line) }
  Warehouse::Report.new(items).render
end
`,
  swift: String.raw`import Foundation

/// A catalogue of items, keyed by identifier.
///
/// - Note: lookups are cached between calls.
@available(iOS 15.0, *)
public struct Catalogue<Item: Identifiable>: Sendable {
    /* Nested /* block comments */ close in the right place. */
    public static let maximumBatchSize = 1_000
    private(set) var items: [Item.ID: Item] = [:]

    private let retryDelays: [Double] = [0.5, 1.25, 2.5e-1]
    private let mask: UInt32 = 0xFF_FF
    private let flags = 0b1011_0110
    private let permissions = 0o755
    private let epsilon = 0x1p-8

    public init(items: [Item] = []) {
        for item in items {
            self.items[item.id] = item
        }
    }

    public subscript(id: Item.ID) -> Item? {
        items[id]
    }
}

enum LoadError: Error {
    case notFound(sku: String)
    case transport(underlying: any Error)
}

@MainActor
final class CatalogueLoader {
    private var task: Task<Void, Never>?

    func load(from url: URL, retrying attempts: Int = 3) async throws -> [String] {
        guard attempts > 0 else {
            throw LoadError.notFound(sku: "unknown\n")
        }

        let (data, response) = try await URLSession.shared.data(from: url)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        print("GET \(url.absoluteString) -> \(status)")

        let names = try JSONDecoder()
            .decode([String].self, from: data)
            .filter { !$0.isEmpty }
            .map { $0.trimmingCharacters(in: .whitespaces) }

        let report = """
            Loaded \(names.count) name(s):
            \(names.joined(separator: ", "))
            """
        let pattern = #"^\d{3}-\#(status)$"#
        NSLog("%@", report + pattern)

        switch names.count {
        case 0:
            throw LoadError.transport(underlying: LoadError.notFound(sku: "empty"))
        case 1...9:
            return names
        default:
            return Array(names.prefix(Self.pageSize))
        }
    }

    static var pageSize: Int { 20 }

    deinit {
        task?.cancel()
    }
}

extension Catalogue where Item: Equatable {
    func contains(_ item: Item, ignoringCase: Bool = false) -> Bool {
        items.values.contains { $0 == item }
    }
}
`,
}
