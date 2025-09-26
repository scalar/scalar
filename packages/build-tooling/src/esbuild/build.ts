import fs from 'node:fs/promises'
import { addPackageFileExports, findEntryPoints } from '../helpers'
import * as esbuild from 'esbuild'
import chokidar from 'chokidar'
import path from 'node:path'
import as from 'ansis'
import { runCommand } from './helpers'
import { glob } from 'glob'

function makeEntryPoints(allowJs?: boolean) {
  const entryPoints = ['src/**/*.ts']

  if (allowJs) {
    entryPoints.push('src/**/*.js')
  }

  const entryPointsWithoutTests = glob.sync(entryPoints, {
    ignore: ['**/*.@(test|spec).@(ts|js)'],
  })

  return entryPointsWithoutTests
}

function nodeBuildOptions(
  options: { bundle?: boolean; shimRequire?: boolean; allowJs?: boolean; options?: esbuild.BuildOptions } = {},
): esbuild.BuildOptions {
  return {
    entryPoints: options.bundle ? ['src/index.ts'] : makeEntryPoints(options.allowJs),
    bundle: options.bundle || false,
    platform: 'node',
    target: 'node20',
    banner: options.shimRequire ? esmRequireShimBanner : undefined,
    ...options.options,
  }
}

function browserBuildOptions({ allowJs = false }: { allowJs?: boolean }): esbuild.BuildOptions {
  return {
    entryPoints: makeEntryPoints(allowJs),
    bundle: false,
    platform: 'browser',
    target: 'ES2022',
  }
}

/**
 * Builds pure TS packages with esbuild.
 *
 * Platforms can be node | browser. For shared builds use browser
 *
 * The `entries` parameter is either a subset of entry points to build, or `'auto'`
 * to find all index.ts files in the project.
 *
 * @scalar/build-tooling type building should be run after to generate types and handle path aliases
 *
 * If post-build actions are needed (such as copying files), use the `onSuccess` callback.
 */
export async function build({
  platform,
  sourcemap = true,
  entries,
  bundle,
  shimRequire,
  options,
  onSuccess,
  allowCss = false,
  allowJs = false,
}: {
  platform?: 'node' | 'browser' | 'shared'
  sourcemap?: boolean
  entries: string[] | 'auto'
  bundle?: boolean
  shimRequire?: boolean
  allowCss?: boolean
  allowJs?: boolean
  options?: esbuild.BuildOptions
  /**
   * Handler that runs after the build is complete
   * Used for post-build actions (ex. copying css files)
   */
  onSuccess?: () => Promise<void> | void
  onBeforeBuild?: () => Promise<void> | void
}) {
  await fs.rm('dist', { recursive: true, force: true })

  /**
   * Either we find all index.ts files and write them to the package exports
   * or we write a specified subset (ex. entries: ['src/index.ts'])
   */
  if (entries === 'auto') {
    await findEntryPoints({ allowCss })
  } else {
    await addPackageFileExports({
      entries,
      allowCss,
    })
  }

  const buildOptions =
    platform === 'node' ? nodeBuildOptions({ bundle, shimRequire, allowJs }) : browserBuildOptions({ allowJs })

  const esbuildCtx = await esbuild.context({
    sourcemap: sourcemap || true,
    format: 'esm',
    outdir: 'dist',
    ...buildOptions,
    ...options,
  })

  if (!process.env.ESBUILD_WATCH) {
    const start = performance.now()
    return esbuild
      .build({
        sourcemap: sourcemap || true,
        format: 'esm',
        outdir: 'dist',
        ...buildOptions,
        ...options,
      })
      .finally(async () => {
        const packageName = path.basename(process.cwd())
        const end = performance.now()
        console.log(as.blue(`@scalar/${packageName}: Build completed in ${(end - start).toFixed(2)}ms`))

        if (onSuccess) {
          await onSuccess()
          console.log(
            as.blue(
              `@scalar/${packageName}: Additional build tasks completed in ${(performance.now() - end).toFixed(2)}ms`,
            ),
          )
        }
        process.exit(0)
      })
  }

  console.log(as.blue('[esbuild]: Running initial build'))
  await esbuildCtx.rebuild()
  console.log(as.blue('[esbuild]: Initial build complete'))

  const start = performance.now()
  runCommand('tsc       -p tsconfig.build.json --watch', 'tsc')
  runCommand('tsc-alias -p tsconfig.build.json --watch', 'tsc-alias')
  const end = performance.now()
  console.log(as.blue(`[esbuild]: Types build completed in ${(end - start).toFixed(0)}ms`))

  const srcDir = path.join(process.cwd(), 'src')
  const watcher = chokidar.watch([srcDir, 'package.json', 'tsconfig.json', 'tsconfig.build.json'], {
    persistent: true,
  })
  console.log(as.blue(`[esbuild]: Watching ${srcDir}`))

  watcher.on('change', async () => {
    console.log(as.cyan('[esbuild]: Rebuilding...'))
    await esbuildCtx.rebuild()
  })

  return new Promise((resolve) => {
    const exit = () => {
      watcher.close()
      esbuildCtx.dispose()
      resolve(true)
    }

    process.on('SIGINT', exit)
    process.on('SIGTERM', exit)
    process.on('exit', () => {
      console.log(as.magenta('[esbuild]: exiting watch...'))
    })
  })
}

/** Shims require for ESM builds while bundling */
export const ESM_REQUIRE_SHIM = `
await (async () => {
  const { dirname } = await import("path");
  const { fileURLToPath } = await import("url");

  /**
   * Shim entry-point related paths.
   */
  if (typeof globalThis.__filename === "undefined") {
    globalThis.__filename = fileURLToPath(import.meta.url);
  }
  if (typeof globalThis.__dirname === "undefined") {
    globalThis.__dirname = dirname(globalThis.__filename);
  }
  /**
   * Shim require if needed.
   */
  if (typeof globalThis.require === "undefined") {
    const { default: module } = await import("module");
    globalThis.require = module.createRequire(import.meta.url);
  }
})();
`

/**
 * Shim banner to support node:require for bundled builds
 */
export const esmRequireShimBanner = {
  js: ESM_REQUIRE_SHIM,
}
