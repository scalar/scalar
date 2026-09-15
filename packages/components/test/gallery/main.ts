// Theming — imported in the same order as .storybook/preview.ts so the cascade resolves identically
import '@scalar/themes/fonts.css'
import '@scalar/themes/style.css'

import { type App, type Component, createApp, h } from 'vue'

import '../../src/style.css'
import '../../.storybook/preview.css'
import './gallery.css'

import { type ThemeVariantId, applyThemeVariant, defaultThemeVariant } from '@scalar/helpers/storybook/themes'

/**
 * The component gallery that hosts Playwright's `mount()` fixture.
 *
 * Playwright navigates to this page and calls `window.mount({ story, props })`, then screenshots
 * `#root`. Both names are fixed by the fixture, so neither is ours to choose.
 *
 * Rather than keep a second set of stories in step with the first, the gallery renders the Storybook
 * CSF files the workbench already uses. That means reading the handful of CSF fields the stories
 * actually rely on — `render`, `args`, `argTypes.mapping`, `component` and `parameters.layout` — and
 * applying the same body classes Storybook would, which is what keeps the committed snapshots
 * comparable.
 */

/** The parts of a CSF module the gallery reads. Storybook's own types cover far more than we need. */
type StoryModule = {
  default: Meta
  [exportName: string]: Meta | Story
}

type Meta = {
  component?: Component
  render?: Render
  args?: Args
  argTypes?: ArgTypes
  parameters?: Parameters
}

type Story = {
  render?: Render
  args?: Args
  argTypes?: ArgTypes
  parameters?: Parameters
}

type Args = Record<string, unknown>

/** Only the one field of Storybook's argTypes that changes what renders. */
type ArgTypes = Record<string, { mapping?: Record<string, unknown> }>

type Parameters = { layout?: Layout }

type Render = (args: Args) => Component

type Layout = 'padded' | 'fullscreen' | 'centered'

/** Body class Storybook applies per layout, and which our `gallery.css` styles. */
const LAYOUT_CLASSES = {
  padded: 'sb-main-padded',
  fullscreen: 'sb-main-fullscreen',
  centered: 'sb-main-centered',
} as const satisfies Record<Layout, string>

/** Storybook's default when a story sets no layout parameter. */
const DEFAULT_LAYOUT: Layout = 'padded'

const storyModules = import.meta.glob<StoryModule>('../../src/**/*.stories.ts')

/** Matches preview.ts, which sets these once when the Storybook preview boots. */
document.body.classList.add('scalar-app', 'light-mode', 'sb-show-main')

/** The story currently rendered into `#root`, kept so the next mount can tear it down. */
let app: App | null = null

/**
 * Finds the CSF module for a component.
 *
 * Every component's stories file is named after the component, so the component name is enough to
 * locate it without maintaining a separate id map.
 */
const loadStoryModule = (component: string): Promise<StoryModule> => {
  const entry = Object.entries(storyModules).find(([path]) => path.endsWith(`/${component}.stories.ts`))

  if (!entry) {
    throw new Error(`No stories file found for component "${component}" (looked for ${component}.stories.ts)`)
  }

  return entry[1]()
}

/** Strips a name down to the form Storybook compares story ids in: lowercase and alphanumeric. */
const normalize = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '')

/**
 * Resolves a story export from the name a test asked for.
 *
 * Storybook resolves stories through a slugged id rather than the export name, so the tests lean on
 * that being forgiving: `'base'` finds `Base`, `'Label and Hotkey'` finds `LabelAndHotkey`, and
 * `'resize'` finds `Resized`. Matching on the export name alone is stricter than what the committed
 * snapshots were recorded against, so normalize first and fall back to a prefix match.
 *
 * An ambiguous prefix throws rather than picking one, so a wrong story fails loudly instead of
 * quietly snapshotting the wrong component.
 */
const resolveStory = (module: StoryModule, component: string, storyName: string): Story => {
  const exports = Object.entries(module).filter(([name]) => name !== 'default')
  const wanted = normalize(storyName)

  const exact = exports.filter(([name]) => normalize(name) === wanted)
  const candidates = exact.length > 0 ? exact : exports.filter(([name]) => normalize(name).startsWith(wanted))
  const [match] = candidates

  if (!match) {
    throw new Error(`No story "${storyName}" exported from ${component}.stories.ts`)
  }

  if (candidates.length > 1) {
    throw new Error(
      `Story "${storyName}" is ambiguous in ${component}.stories.ts: ${candidates.map(([name]) => name).join(', ')}`,
    )
  }

  return match[1] as Story
}

/**
 * Applies Storybook's `argTypes.mapping` to the resolved args.
 *
 * A story can take a short label as an arg and swap it for the real value behind it — `ScalarMarkdown`
 * accepts `"Blockquotes"` and renders the sample document that label stands for. Skipping this step
 * renders the label itself, which is what the whole markdown suite was doing.
 */
const applyArgTypeMappings = (args: Args, argTypes: ArgTypes): Args =>
  Object.fromEntries(
    Object.entries(args).map(([key, value]) => {
      const mapping = argTypes[key]?.mapping
      return [key, mapping && typeof value === 'string' && value in mapping ? mapping[value] : value]
    }),
  )

window.mount = async ({ story: storyId, props }) => {
  const [component, storyName] = storyId.split('/')

  if (!component || !storyName) {
    throw new Error(`Expected a story id of the form "Component/Story Name", received "${storyId}"`)
  }

  const module = await loadStoryModule(component)
  const meta = module.default
  const story = resolveStory(module, component, storyName)

  const args = applyArgTypeMappings({ ...meta.args, ...story.args, ...props }, { ...meta.argTypes, ...story.argTypes })

  // Storybook sizes the preview body from the story's layout, and the snapshots are pinned to it
  const layout = story.parameters?.layout ?? meta.parameters?.layout ?? DEFAULT_LAYOUT
  document.body.classList.remove(...Object.values(LAYOUT_CLASSES))
  document.body.classList.add(LAYOUT_CLASSES[layout])

  // Applied before the story renders, so the theme is in place for the first paint
  applyThemeVariant(window.__scalarTheme ?? defaultThemeVariant)

  const render = story.render ?? meta.render
  const definition = render
    ? render(args)
    : {
        render: () => {
          if (!meta.component) {
            throw new Error(`${component}.stories.ts has neither a render function nor a component`)
          }
          return h(meta.component, args)
        },
      }

  app?.unmount()

  // Vue reports render errors to a handler instead of rejecting the mount, so hold onto the first
  // one and rethrow it. Without this a broken story screenshots as an empty page and silently passes.
  let renderError: unknown

  app = createApp(definition)
  app.config.errorHandler = (error) => {
    renderError ??= error
  }
  app.mount('#root')

  if (renderError) {
    throw renderError
  }

  // The Scalar fonts are served with font-display: swap, so text paints in a fallback face first
  await document.fonts.ready
  await new Promise((resolve) => requestAnimationFrame(resolve))
}

window.unmount = () => {
  app?.unmount()
  app = null
}

declare global {
  interface Window {
    /** Renders a story into `#root`. Called by Playwright's `mount()` fixture. */
    mount: (params: { story: string; props?: Args }) => Promise<void>
    /** Tears down the rendered story. Called by the locator's `unmount()`. */
    unmount: () => void
    /** Theme to render under, set by the test harness via `page.addInitScript`. */
    __scalarTheme?: ThemeVariantId
  }
}
