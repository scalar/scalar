import { expect, test } from 'bun:test'

import generateCloudBuild from './index'

test('generateCloudBuild', async () => {
  const file = Bun.file(import.meta.dir + '/servicesTest.json') // BunFile
  const services = await file.json()

  const result = await generateCloudBuild(services)

  const yamlFile = Bun.file(import.meta.dir + '/cloudbuildTest.yaml') // BunFile
  const yaml = await yamlFile.text()

  expect(result).toBe(yaml)
})
