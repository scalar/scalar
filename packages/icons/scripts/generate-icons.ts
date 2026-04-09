#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

import { icons } from '@phosphor-icons/core'
import chalk from 'chalk'

const prefix = 'ScalarIcon'

const ASSETS_PATH = path.join(import.meta.dirname, '../node_modules/@phosphor-icons/core/assets')
const COMPONENTS_PATH = path.join(import.meta.dirname, '../src/components')
const INDEX_PATH = path.join(import.meta.dirname, '../src/index.ts')

if (!fs.existsSync(ASSETS_PATH)) {
  console.error(
    `${chalk.inverse.red(
      ' FAIL ',
    )} Could not find assets directory, please make sure all git submodules are initialized and up to date.`,
  )
  process.exit(1)
}

const mappings = readFiles()

generateComponents(mappings)
generateExports(mappings)

console.log(chalk.green(`Compiled ${Object.keys(mappings).length} icons`))

function readFiles(): Record<string, Record<string, string>> {
  const mappings: Record<string, Record<string, string>> = {}

  const variants = fs.readdirSync(ASSETS_PATH, 'utf-8')

  variants.forEach((variant) => {
    const variantPath = path.join(ASSETS_PATH, variant)

    // Skip non-directories
    if (!fs.lstatSync(variantPath).isDirectory()) {
      return
    }

    // Read all icons in variant
    const icons = fs.readdirSync(variantPath, 'utf-8')

    icons.forEach((icon) => {
      let key: string | undefined = undefined
      if (variant === 'regular') {
        key = icon.replace('.svg', '')
      } else {
        key = icon.replace('.svg', '').split('-').slice(0, -1).join('-')
      }
      // Create variant object if it doesn't exist
      if (!mappings[key]) {
        mappings[key] = {}
      }

      const iconPath = path.join(variantPath, icon)
      // Skip directories
      if (fs.lstatSync(iconPath).isDirectory()) {
        return
      }
      ;(mappings[key] as NonNullable<(typeof mappings)[string]>)[variant] = readFile(iconPath)
    })
  })

  return mappings
}

function readFile(path: string) {
  return fs
    .readFileSync(path)
    .toString('utf-8')
    .replace(/<svg.*?>/g, '')
    .replace(/<\/svg>/g, '')
}

function generateComponents(mappings: Record<string, Record<string, string>>) {
  let _passes = 0
  let _fails = 0

  if (fs.existsSync(COMPONENTS_PATH)) {
    fs.rmSync(COMPONENTS_PATH, { recursive: true })
  }

  fs.mkdirSync(COMPONENTS_PATH)

  for (const icon in mappings) {
    if (Object.hasOwn(mappings, icon)) {
      const variants = mappings[icon]

      const name = pascalize(icon)

      const content = Object.entries(variants ?? {})
        .map(([variant, content], index) => {
          return `\n<g v-${index > 0 ? 'else-' : ''}if="weight === '${variant}'">${content}</g>`
        })
        .join('')

      const componentString = `\
/* GENERATED FILE */
<script lang="ts">
export default {
  name: "${prefix}${name}"
}
</script>
<script lang="ts" setup>
import { useScalarIcon } from '@/hooks'
import type { ScalarIconProps } from '@/types'

const props = defineProps<ScalarIconProps>()

const { bind, weight } = useScalarIcon(props)
</script>
<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    fill="currentColor"
    v-bind="bind">
    <slot />${content}
  </svg>
</template>
`
      try {
        fs.writeFileSync(path.join(COMPONENTS_PATH, `${prefix}${name}.vue`), componentString, {
          flag: 'w',
        })
        console.log(`${chalk.inverse.green(' DONE ')} ${prefix}${name}`)
        _passes += 1
      } catch (err) {
        console.error(`${chalk.inverse.red(' FAIL ')} ${prefix}${name} could not be saved`)
        console.group()
        console.error(err)
        console.groupEnd()
        _fails += 1
      }
    }
  }
}

function generateExports(mappings: Record<string, Record<string, string>>) {
  const exports: string[] = []

  Object.entries(mappings).forEach(([name]) => {
    const iconData = icons.find((icon) => icon.name === name)

    if (!iconData) {
      throw new Error(`Could not find icon data for ${name}`)
    }

    const componentPath = `./components/${prefix}${iconData.pascal_name}.vue`
    exports.push(`export { default as ${prefix}${iconData.pascal_name} } from '${componentPath}'`)

    if ('alias' in iconData) {
      exports.push(`export { default as ${prefix}${iconData['alias'].pascal_name} } from '${componentPath}'`)
    }
  })

  const indexString = `/* GENERATED FILE */
/* biome-ignore-all assist/source/organizeImports: generated file */

${exports.join('\n')}
`

  try {
    fs.writeFileSync(INDEX_PATH, indexString, {
      flag: 'w',
    })
    console.log(chalk.green('Export success'))
  } catch (err) {
    console.error(chalk.red('Export failed'))
    console.group()
    console.error(err)
    console.groupEnd()
  }
}

function pascalize(str: string): string {
  return str
    .split('-')
    .map((substr) => substr.replace(/^\w/, (c) => c.toUpperCase()))
    .join('')
}
