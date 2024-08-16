import SwaggerParser from '@apidevtools/swagger-parser'
import { glob } from 'glob'
import { diff } from 'just-diff'
import fs from 'node:fs'
import { describe, expect, test } from 'vitest'

import { type AnyObject, normalize, openapi } from '../src'

const expectedErrors = {
  'tests/files/opensuseorgobs.yaml': [
    {
      message: "must have required property '$ref'",
    },
  ],
  'tests/files/royalmailcomclick-and-drop.yaml': [
    {
      message: "must have required property 'schema'",
    },
  ],
  'tests/files/spotifycom.yaml': [
    {
      message: 'Can’t resolve URI: ../policies.yaml',
    },
  ],
}

// We can’t make a diff for files with circular references. :(
const circularReferences = [
  'tests/files/xerocomxero_accounting.yaml',
  'tests/files/xtrfeu.yaml',
  'tests/files/webflowcom.yaml',
  'tests/files/amazonawscomathena.yaml',
  'tests/files/amazonawscomce.yaml',
  'tests/files/amazonawscomconnect.yaml',
  'tests/files/opentrialslocal.yaml',
  'tests/files/bbccouk.yaml',
  'tests/files/ote-godaddycomdomains.yaml',
  'tests/files/googleapiscomfirebaserules.yaml',
]

// Just skip some files. If it’s not empty, we’ve got some work to do. :)
const ignoreFiles = [
  // Very slow files
  'tests/files/amazonawscomdynamodb.yaml',
  'tests/files/amazonawscomelasticmapreduce.yaml',
  'tests/files/amazonawscomemr-containers.yaml',
  'tests/files/amazonawscomec2.yaml',
  'tests/files/amazonawscomdynamodb.yaml',
]

const files = (await glob('tests/files/*.yaml'))
  .filter((file) => !ignoreFiles.includes(file))
  // Aphabetic
  .sort()

/**
 * This test suite parses a large number of real-world OpenAPI files
 */
describe('diff', async () => {
  // TODO: We’re currently only testing a few of the files for performance reasons.
  test.each(files.slice(0, 100))('diff: %s', async (file) => {
    const content = fs.readFileSync(file, 'utf-8')
    const specification = normalize(content)

    const oldSchema = (await new Promise((resolve, reject) => {
      SwaggerParser.dereference(
        structuredClone(specification) as never,
        (error, result) => {
          if (error) {
            reject(error)
          }

          if (result === undefined) {
            reject('Couldn’t parse the Swagger file.')

            return
          }
          resolve(result)
        },
      )
    }).catch((error) => {
      console.error('[@apidevtools/swagger-parser]', error.message)
    })) as any

    const { schema: newSchema, errors } = await openapi()
      .load(structuredClone(specification))
      .dereference()
      .get()

    // Errors expected
    if (expectedErrors[file]) {
      expect(errors).toMatchObject(expectedErrors[file])
    }
    // No errors expected
    else {
      // Same number of paths? Or even more?
      expect(Object.keys(oldSchema?.paths ?? {}).length).toBeLessThanOrEqual(
        Object.keys(newSchema?.paths ?? {}).length,
      )

      if (oldSchema) {
        // Any difference?
        let result: any[] = []

        if (!circularReferences.includes(file)) {
          try {
            result = diff(oldSchema, newSchema)
          } catch (error) {
            console.error('[justdiff]', error.message)
          }
        }

        // Log differences
        if (result.length) {
          console.error(
            `⚠️ DIFFERENCES: Found ${result.length} differences in ${file}`,
          )
          console.log()
          result.forEach(({ op, path }) => {
            console.log('* OPERATION:', op)
            console.log('* PATH:', path.join('/'))
            console.log()
            console.log('[@apidevtools/swagger-parser]', get(oldSchema, path))
            console.log('[@scalar/openapi-parser]', get(newSchema, path))
            console.log()
          })
        }

        expect(result.length).toEqual(0)
      }
    }
  })
})

function get(schema: AnyObject, path: (string | number)[]) {
  return path.reduce((acc, key) => acc[key], schema)
}
