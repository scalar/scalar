type PlaygroundType = 'web' | 'desktop'

type LayoutConfig = {
  layout: PlaygroundType
  path: string
}

/**
 * Available playground layouts for testing
 */
const layouts = {
  web: {
    layout: 'web' as const,
    path: '/playground/web/',
  },
  desktop: {
    layout: 'desktop' as const,
    path: '/playground/app/',
  },
} satisfies Record<string, LayoutConfig>

/**
 * Returns the URL for a playground layout
 * Assumes Vite dev server is already running on port 5065 (api-client dev server)
 *
 * @example
 * ```ts
 * const url = await serveExample({ layout: 'web' })
 * await page.goto(url)
 * ```
 */
export function serveExample(options: { layout?: keyof typeof layouts } = {}): Promise<string> {
  const { layout = 'web' } = options
  const config = layouts[layout]

  // Return the URL to the playground running on Vite dev server
  return Promise.resolve(`http://localhost:5065${config.path}`)
}
