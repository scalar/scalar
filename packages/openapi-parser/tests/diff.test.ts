import SwaggerParser from '@apidevtools/swagger-parser'
import { diff } from 'just-diff'
import { describe, expect, test } from 'vitest'

import { type AnyObject, normalize, openapi } from '../src/index.ts'
import { downloadFileToMemory } from './utils/downloadFileGcp.ts'

const bucketName = 'scalar-test-fixtures'

const expectedErrors = {
  'oas/files/opensuseorgobs.yaml': [
    {
      message: "must have required property '$ref'",
    },
  ],
  'oas/files/royalmailcomclick-and-drop.yaml': [
    {
      message: "must have required property 'schema'",
    },
  ],
  'oas/files/spotifycom.yaml': [
    {
      message: 'Can’t resolve URI: ../policies.yaml',
    },
  ],
}

// We can’t make a diff for files with circular references. :(
const circularReferences = [
  'oas/files/xerocomxero_accounting.yaml',
  'oas/files/xtrfeu.yaml',
  'oas/files/webflowcom.yaml',
  'oas/files/amazonawscomathena.yaml',
  'oas/files/amazonawscomce.yaml',
  'oas/files/amazonawscomconnect.yaml',
  'oas/files/opentrialslocal.yaml',
  'oas/files/bbccouk.yaml',
  'oas/files/ote-godaddycomdomains.yaml',
  'oas/files/googleapiscomfirebaserules.yaml',
]

// Just skip some files. If it’s not empty, we’ve got some work to do. :)
const ignoreFiles = [
  // Very slow files
  'oas/files/amazonawscomdynamodb.yaml',
  'oas/files/amazonawscomelasticmapreduce.yaml',
  'oas/files/amazonawscomemr-containers.yaml',
  'oas/files/amazonawscomec2.yaml',
  'oas/files/amazonawscomdynamodb.yaml',
]

// get the list of files from the storage bucket scalar-test-fixtures/oas
const files = await fetch(
  'https://storage.googleapis.com/storage/v1/b/scalar-test-fixtures/o',
)
  .then((response) => response.json())
  .then((data) => data.items)
  .then((data) => data.filter((d) => !ignoreFiles.includes(d.name)))

/**
 * This test suite parses a large number of real-world OpenAPI files
 */
describe('diff', async () => {
  // TODO: We’re currently only testing a few of the files for performance reasons.
  // @ts-ignore
  test.each(files.slice(0, 100))('diff $name', async (file) => {
    console.log(file.name)
    // Fetch the file from cloud storage
    const content = await downloadFileToMemory(bucketName, file.name)

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
