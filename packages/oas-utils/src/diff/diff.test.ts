import { parseJsonOrYaml } from '@/helpers'
import fs from 'node:fs'
import { describe, it } from 'vitest'

import { diffSpec } from './diff'

function loadYaml(name: string) {
  return parseJsonOrYaml(fs.readFileSync(`${import.meta.dirname}/fixtures/${name}.test.yaml`, 'utf-8'))
}

const a = loadYaml('a-basic')
const bAdd = loadYaml('b-basic-add')
const bDelete = loadYaml('b-basic-delete')
const bModify = loadYaml('b-basic-modify')

describe('Diffs specs', () => {
  it('Handles basic add', () => {
    console.log(diffSpec(a, bAdd))
  })

  it('Handles delete', () => {
    console.log(diffSpec(bAdd, bDelete))
  })

  it('Handles modify', () => {
    console.log(diffSpec(a, bModify))
  })
})
