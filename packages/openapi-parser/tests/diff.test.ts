import SwaggerParser from '@apidevtools/swagger-parser'
import { glob } from 'glob'
import { diff } from 'just-diff'
import fs from 'node:fs'
import { describe, expect, test } from 'vitest'

import { type AnyObject, normalize, openapi } from '../src'

const expectedErrors = {
  'packages/openapi-parser/tests/files/opensuseorgobs.yaml': [
    {
      message: "must have required property '$ref'",
    },
  ],
  'packages/openapi-parser/tests/files/royalmailcomclick-and-drop.yaml': [
    {
      message: "must have required property 'schema'",
    },
  ],
  'packages/openapi-parser/tests/files/spotifycom.yaml': [
    {
      message: 'Can’t resolve URI: ../policies.yaml',
    },
  ],
}

// We can’t make a diff for files with circular references. :(
const circularReferences = [
  'packages/openapi-parser/tests/files/xerocomxero_accounting.yaml',
  'packages/openapi-parser/tests/files/xtrfeu.yaml',
  'packages/openapi-parser/tests/files/webflowcom.yaml',
  'packages/openapi-parser/tests/files/amazonawscomathena.yaml',
  'packages/openapi-parser/tests/files/amazonawscomce.yaml',
  'packages/openapi-parser/tests/files/amazonawscomconnect.yaml',
  'packages/openapi-parser/tests/files/opentrialslocal.yaml',
  'packages/openapi-parser/tests/files/bbccouk.yaml',
  'packages/openapi-parser/tests/files/ote-godaddycomdomains.yaml',
  'packages/openapi-parser/tests/files/googleapiscomfirebaserules.yaml',
]

// Just skip some files. If it’s not empty, we’ve got some work to do. :)
const ignoreFiles = [
  // Very slow files
  'packages/openapi-parser/tests/files/amazonawscomdynamodb.yaml',
  'packages/openapi-parser/tests/files/amazonawscomelasticmapreduce.yaml',
  'packages/openapi-parser/tests/files/amazonawscomemr-containers.yaml',
  'packages/openapi-parser/tests/files/amazonawscomec2.yaml',
  'packages/openapi-parser/tests/files/amazonawscomdynamodb.yaml',
]

const files = (await glob('./packages/openapi-parser/tests/files/*.yaml'))
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
