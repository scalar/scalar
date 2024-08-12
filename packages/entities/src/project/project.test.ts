import { defaultProject, defaultVersion, defaultWebsite } from '@/project'
import { nanoid } from 'nanoid'
import { describe, expect, test } from 'vitest'

describe('Correctly defaults types', () => {
  test('Defaults website', () => {
    const site = defaultWebsite()

    expect(site).toHaveProperty('lastDeployed')
    expect(site).toHaveProperty('subdomainPrefix')
    expect(site).toHaveProperty('customUrl')
  })

  test('Defaults project', () => {
    const project = defaultProject()

    expect(typeof project.createdAt === 'number').toEqual(true)
    expect(typeof project.updatedAt === 'number').toEqual(true)
    expect(typeof project.website === 'object').toEqual(true)
  })

  test('Defaults version', () => {
    const version = defaultVersion(nanoid())

    expect(typeof version.name === 'string').toEqual(true)
    expect(version.guides.length > 0).toEqual(true)
    expect(version.references.length > 0).toEqual(true)

    const guide = version.guides[0]
    const reference = version.references[0]

    expect(guide).toHaveProperty('description')
    expect(guide).toHaveProperty('title')
    expect(guide).toHaveProperty('uid')

    expect(reference).toHaveProperty('description')
    expect(reference).toHaveProperty('title')
    expect(reference).toHaveProperty('uid')
  })
})
