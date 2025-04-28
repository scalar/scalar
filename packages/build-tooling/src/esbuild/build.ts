import fs from 'node:fs/promises'
import { addPackageFileExports, findEntryPoints } from '../helpers'
import * as esbuild from 'esbuild'
import chokidar from 'chokidar'
import path from 'node:path'
import as from 'ansis'
import { runCommand } from './helpers'

function nodeBuildOptions(
  options: {
    bundle?: boolean
    shimRequire?: boolean
    options?: esbuild.BuildOptions
  } = {},
): esbuild.BuildOptions {
  return {
    entryPoints: options.bundle ? ['src/index.ts'] : ['src/**/*.ts'],
    bundle: options.bundle || false,
    platform: 'node',
    target: 'node20',
    banner: options.shimRequire ? esmRequireShimBanner : undefined,
    ...options.options,
  }
}

function browserBuildOptions(_options: Record<string, never>): esbuild.BuildOptions {
  return {
    entryPoints: ['src/**/*.ts'],
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
 */
export async function build({
  platform,
  sourcemap = true,
  entries,
  bundle,
  shimRequire,
  options,
  onSuccess,
}: {
  platform?: 'node' | 'browser' | 'shared'
  sourcemap?: boolean
  entries: string[] | 'auto'
  bundle?: boolean
  shimRequire?: boolean
  options?: esbuild.BuildOptions
  onSuccess?: () => Promise<void> | void
}) {
  await fs.rm('dist', { recursive: true, force: true })

  /**
   * Either we find all index.ts files and write them to the package exports
   * or we write a specified subset (ex. entries: ['src/index.ts'])
   */
  if (entries === 'auto') {
    await findEntryPoints({})
  } else {
    await addPackageFileExports({
      entries,
      allowCss: false,
    })
  }

  const buildOptions = platform === 'node' ? nodeBuildOptions({ bundle, shimRequire }) : browserBuildOptions({})

  const esbuildCtx = await esbuild.context({
    sourcemap: sourcemap || true,
    format: 'esm',
    outdir: 'dist',
    ...buildOptions,
    ...options,
  })

  if (!process.env.ESBUILD_WATCH) {
    return esbuild
      .build({
        sourcemap: sourcemap || true,
        format: 'esm',
        outdir: 'dist',
        ...buildOptions,
        ...options,
      })
      .finally(async () => {
        if (onSuccess) {
          await onSuccess()
        }
        process.exit(0)
      })
  }

  console.log(as.blue('[esbuild]: Running initial build'))
  await esbuildCtx.rebuild()
  runCommand('tsc       -p tsconfig.build.json --watch', 'tsc')
  runCommand('tsc-alias -p tsconfig.build.json --watch', 'tsc-alias')

  console.log(as.blue('[esbuild]: Initial build complete'))

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
