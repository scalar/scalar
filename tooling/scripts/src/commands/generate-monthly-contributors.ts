// Checkout /tooling/scripts/README.md for more information on how to use this command.

import fs from 'node:fs/promises'
import path from 'node:path'

import as from 'ansis'
import { Command } from 'commander'

import { getWorkspaceRoot } from '@/helpers'

// The repository we count contributions for.
const OWNER = 'scalar'
const REPO = 'scalar'

// Where the generated images live, relative to the repository root.
const ASSETS_DIR = '.github/assets/contributors'

// How many contributors we show, split across the two flying banners.
const TOP_N = 10

// Bot accounts never show up in the list, even though staff members do. Logins
// ending in `[bot]` and accounts of type `Bot` are filtered automatically. This
// denylist catches bot-like and AI agent accounts that GitHub reports as `User`.
const BOT_DENYLIST = new Set([
  'scalar-release-bot',
  'renovate',
  'dependabot',
  'cobyfrombrooklyn-bot',
  'claude',
  'junie-agent',
  'cursor',
  'cursoragent',
  'devin-ai-integration',
  'copilot',
])

// --- Types -----------------------------------------------------------------

type WeekStat = { w: number; a: number; d: number; c: number }

type StatsContributor = {
  author: { login: string; type: string } | null
  weeks: WeekStat[]
}

type Contributor = {
  login: string
  commits: number
  additions: number
  deletions: number
}

type MonthRange = {
  /** ISO start of the month, inclusive. */
  since: string
  /** ISO start of the next month, exclusive. */
  until: string
  /** Unix seconds for the start of the month. */
  sinceUnix: number
  /** Unix seconds for the start of the next month. */
  untilUnix: number
  /** Machine friendly month, for example `2026-07`. */
  slug: string
  /** Human friendly month, for example `July 2026`. */
  label: string
}

// --- Command ---------------------------------------------------------------

export const generateMonthlyContributors = new Command('generate-monthly-contributors')
  .description('Refresh the animated top contributors image and the README')
  .option('-m, --month <YYYY-MM>', 'The month to generate, defaults to the previous full month')
  .action(async ({ month }: { month?: string }) => {
    const range = resolveRange(month)
    console.log(as.cyan(`Refreshing top contributors for ${as.bold(range.label)}...`))

    const token = process.env.GITHUB_TOKEN
    const stats = await fetchContributorStats(token)
    const ranked = selectTop(aggregateMonthly(stats, range), TOP_N)

    if (ranked.length === 0) {
      console.log(as.yellow('No human contributors found for this month. Nothing to generate.'))
      return
    }

    console.log(as.cyan(`Top ${ranked.length}: ${ranked.map((contributor) => contributor.login).join(', ')}`))
    const entries = ranked.map((contributor, index) => formatEntry(contributor, index + 1))

    const root = getWorkspaceRoot()
    const assetsDir = path.join(root, ASSETS_DIR)
    await fs.mkdir(assetsDir, { recursive: true })
    await fs.writeFile(path.join(assetsDir, 'top-contributors-light.svg'), renderSvg(entries, 'light'))
    await fs.writeFile(path.join(assetsDir, 'top-contributors-dark.svg'), renderSvg(entries, 'dark'))

    const readmePath = path.join(root, 'README.md')
    const readme = await fs.readFile(readmePath, 'utf-8')
    await fs.writeFile(readmePath, updateReadme(readme, range))

    console.log(as.green(`✔ Updated the README and images for ${range.label}`))
  })

// --- Data ------------------------------------------------------------------

/**
 * Resolves the month to generate. Without an explicit month we use the previous
 * full month, which is what the scheduled workflow wants on the first of a month.
 */
export function resolveRange(month?: string, now = new Date()): MonthRange {
  const target =
    month !== undefined
      ? new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1))
      : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))

  const start = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), 1))
  const end = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 1))

  return {
    since: start.toISOString(),
    until: end.toISOString(),
    sinceUnix: Math.floor(start.getTime() / 1000),
    untilUnix: Math.floor(end.getTime() / 1000),
    slug: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`,
    label: start.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
  }
}

/**
 * Fetches per-contributor weekly stats. GitHub computes these asynchronously and
 * answers with `202` while the cache is warming up, so we retry a few times.
 */
async function fetchContributorStats(token?: string): Promise<StatsContributor[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'scalar-monthly-contributors',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  for (let attempt = 0; attempt < 8; attempt++) {
    const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/stats/contributors`, { headers })

    if (response.status === 202) {
      // Stats are being generated, wait and try again.
      await sleep(3000)
      continue
    }
    if (!response.ok) {
      throw new Error(`GitHub API request failed (${response.status}): ${await response.text()}`)
    }

    return (await response.json()) as StatsContributor[]
  }

  throw new Error('GitHub did not finish computing contributor stats in time')
}

/** Sums the weekly stats that fall within the month, dropping bots. */
export function aggregateMonthly(stats: StatsContributor[], range: MonthRange): Contributor[] {
  const contributors: Contributor[] = []

  for (const { author, weeks } of stats) {
    if (!author || isBot(author.login, author.type)) {
      continue
    }

    let commits = 0
    let additions = 0
    let deletions = 0
    for (const week of weeks) {
      // A week is bucketed into the month that contains its (Sunday) start.
      if (week.w >= range.sinceUnix && week.w < range.untilUnix) {
        commits += week.c
        additions += week.a
        deletions += week.d
      }
    }

    if (commits > 0) {
      contributors.push({ login: author.login, commits, additions, deletions })
    }
  }

  return contributors
}

/** Bots and AI agents are filtered out, human staff members are kept. */
export function isBot(login: string, type: string): boolean {
  return type === 'Bot' || login.endsWith('[bot]') || BOT_DENYLIST.has(login.toLowerCase())
}

/** Returns the top contributors, ranked by commits then additions then login. */
export function selectTop(contributors: Contributor[], limit: number): Contributor[] {
  return [...contributors]
    .sort((a, b) => b.commits - a.commits || b.additions - a.additions || a.login.localeCompare(b.login))
    .slice(0, limit)
}

/** Builds the banner text, for example `#1 hanspagel - 45 commits 14,224 ++ 1,382 --`. */
export function formatEntry(contributor: Contributor, rank: number): string {
  const additions = contributor.additions.toLocaleString('en-US')
  const deletions = contributor.deletions.toLocaleString('en-US')
  return `#${rank} ${contributor.login} - ${contributor.commits} commits ${additions} ++ ${deletions} --`
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

// --- Rendering -------------------------------------------------------------

// The two flap frames of the ASCII plane. Kept as line arrays so the many
// backslashes do not have to be escaped inside a template literal.
const PLANE_FRAME_A = [
  '              ____',
  '|~~~ \\       |     \\         |',
  '| |   \\______\\ (..) /|_______:_ ',
  '|_|___        \\_~~_/   ``````|/',
  '\\_|__/--,   ,=========(_____/:  ',
  "        '___\\       /        |",
  '             \\     |',
  '              \\____|',
].join('\n')

const PLANE_FRAME_B = [
  '              ____',
  '|~~~ \\       |     \\         :',
  '| |   \\______\\ (..) /|_______|_ ',
  '|_|___        \\_~~_/   ``````|/',
  '\\_|__/--,   ,=========(_____/|  ',
  "        '___\\       /        :",
  '             \\     |',
  '              \\____|',
].join('\n')

/**
 * Renders the animated contributors image: two ASCII planes that fly across the
 * README, each cycling through five contributors. This mirrors the original
 * hand-made SVG and only swaps in fresh data.
 */
export function renderSvg(entries: string[], theme: 'light' | 'dark'): string {
  // Banner one carries the odd ranks (#1, #3, ...), banner two the even ranks.
  const bannerOne = entries.filter((_, index) => index % 2 === 0)
  const bannerTwo = entries.filter((_, index) => index % 2 === 1)

  const textColor = theme === 'dark' ? '#e7e7e7' : '#1b1b1b'

  return `<svg xmlns="http://www.w3.org/2000/svg">
    <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" class="fixme">
            <div class="markdown-body">
              <div class="banner-bunny-bounce">
                <div class="banner">
                  <div class="banner-text banner-text-oner"></div>
                  ${renderPlane()}
                </div>
              </div>
              <div class="banner-bunny-bounce banner-bunny-bounce2">
                <div class="banner">
                  <div class="banner-text banner-text-twoer"></div>
                  ${renderPlane()}
                </div>
              </div>
            </div>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              .markdown-code {
                font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
                white-space: pre;
                font-size: 10px;
              }
              .markdown-body {
                gap: 18px;
                display: flex;
                color: ${textColor};
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
              }
              .fixme { position: relative; }
              .banner {
                width: 700px;
                height: 70px;
                display: flex;
                align-items: center;
                transform: rotate(3deg);
                top: 50px;
                position: absolute;
                animation: bannermove 10s infinite linear;
              }
              .banner-bunny-bounce2 { top: 100px; left: -100px; position: absolute; }
              .banner-bunny-bounce2 .banner { animation: bannermove 9s infinite linear; }
              .banner-text {
                width: 100%;
                background: #069061;
                height: 38px;
                line-height: 38px;
                position: relative;
                text-align: center;
                color: white;
                font-weight: bold;
                font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
                margin-top: 12px;
                margin-right: -3px;
              }
              .banner-text-oner { animation: bannerbgchange 50s steps(5) infinite; }
              @keyframes bannerbgchange {
                0%, 20% { background: #069061; }
                20.1%, 40% { background: #dc1b19; }
                40.1%, 60% { background: #edbe20; }
                60.1%, 80% { background: #069061; }
                80.1%, 100% { background: #5203d1; }
              }
              .banner-text-twoer { animation: bannerbgchangetwoer 45s steps(5) infinite; }
              @keyframes bannerbgchangetwoer {
                0%, 20% { background: #0082d0; }
                20.1%, 40% { background: #fb892c; }
                40.1%, 60% { background: black; }
                60.1%, 80% { background: #0082d0; }
                80.1%, 100% { background: #fb2c90; }
              }
              .banner-text-oner:before {
                content: "${bannerOne[0] ?? ''}";
                animation: bannertextchange 50s infinite linear;
              }
              ${renderContentKeyframes('bannertextchange', bannerOne)}
              .banner-text-twoer:before {
                content: "${bannerTwo[0] ?? ''}";
                animation: bannertexttwochange 45s infinite linear;
              }
              ${renderContentKeyframes('bannertexttwochange', bannerTwo)}
              .banner-bunny-bounce2 .banner-text { background: #0082d0; }
              .banner-bunny { background: transparent; width: 190px; height: 80px; z-index: 10; position: relative; }
              .visible { opacity: 0; animation: rabbitanimation2 .5s steps(1) infinite; }
              .hidden { position: absolute; top: 0; opacity: 1; animation: rabbitanimation .5s steps(1) infinite; }
              .banner-bunny-bounce { animation: bannerbunnybounce .5s steps(2) infinite; }
              @keyframes bannerbunnybounce {
                0% { transform: translate3d(0,3px,0); }
                100% { transform: translate3d(0,0,0); }
              }
              @keyframes bannermove {
                0% { transform: translate3d(-100%,0,0) rotate(3deg); }
                100% { transform: translate3d(140%,0,0) rotate(3deg); }
              }
              @keyframes rabbitanimation2 { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
              @keyframes rabbitanimation { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }
            </style>
        </div>
    </foreignObject>
</svg>
`
}

/** Renders the two flap frames of a single ASCII plane. */
function renderPlane(): string {
  return `<div class="banner-bunny">
                    <pre class="markdown-code visible">${PLANE_FRAME_A}</pre>
                    <pre class="markdown-code hidden">${PLANE_FRAME_B}</pre>
                  </div>`
}

/**
 * Builds a `@keyframes` rule that swaps the banner text between the given
 * entries at equal intervals. CSS `content` cannot interpolate, so each entry
 * simply holds for its slice of the timeline.
 */
function renderContentKeyframes(name: string, entries: string[]): string {
  const count = Math.max(entries.length, 1)
  const step = 100 / count

  const frames = entries
    .map((entry, index) => {
      const start = index === 0 ? '0%' : `${trimNumber(index * step)}.1%`
      const end = `${trimNumber((index + 1) * step)}%`
      return `                ${start}, ${end} { content: "${entry}"; }`
    })
    .join('\n')

  return `@keyframes ${name} {\n${frames}\n              }`
}

/** Formats a percentage without noisy trailing zeros (20 -> "20", 33.33 -> "33.3"). */
function trimNumber(value: number): string {
  return Number(value.toFixed(1)).toString()
}

// --- README ----------------------------------------------------------------

const START_MARKER = '<!-- monthly-contributors:start -->'
const END_MARKER = '<!-- monthly-contributors:end -->'

/** Replaces the content between the markers, bumping the cache-busting query. */
export function updateReadme(readme: string, range: MonthRange): string {
  // The `?v=` query busts GitHub's image proxy cache when the file is replaced.
  // The `#gh-*-mode-only` fragments let GitHub pick the light or dark variant.
  const block = `${START_MARKER}
<p>
	<img width="830" height="280" src="./${ASSETS_DIR}/top-contributors-light.svg?v=${range.slug}#gh-light-mode-only" alt="Top contributors in ${range.label}">
	<img width="830" height="280" src="./${ASSETS_DIR}/top-contributors-dark.svg?v=${range.slug}#gh-dark-mode-only" alt="Top contributors in ${range.label}">
</p>
${END_MARKER}`

  const pattern = new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`)
  if (!pattern.test(readme)) {
    throw new Error(`Could not find the ${START_MARKER} ... ${END_MARKER} block in the README`)
  }

  return readme.replace(pattern, block)
}
