import SwaggerParser from '@apidevtools/swagger-parser'
import { diff } from 'just-diff'
import { describe, expect, test } from 'vitest'

import { type AnyObject, normalize, openapi } from '../src/index.js'
import { downloadFileToMemory } from './utils/downloadFileGcp.js'

const bucketName = 'test-specifications'

const expectedErrors = {
  'files/opensuseorgobs.yaml': [
    {
      message: "must have required property '$ref'",
    },
  ],
  'files/royalmailcomclick-and-drop.yaml': [
    {
      message: "must have required property 'schema'",
    },
  ],
  'files/spotifycom.yaml': [
    {
      message: 'Can’t resolve URI: ../policies.yaml',
    },
  ],
}

// We can’t make a diff for files with circular references. :(
const circularReferences = [
  'files/xerocomxero_accounting.yaml',
  'files/xtrfeu.yaml',
  'files/webflowcom.yaml',
  'files/amazonawscomathena.yaml',
  'files/amazonawscomce.yaml',
  'files/amazonawscomconnect.yaml',
  'files/opentrialslocal.yaml',
  'files/bbccouk.yaml',
  'files/ote-godaddycomdomains.yaml',
  'files/googleapiscomfirebaserules.yaml',
]

// Just skip some files. If it’s not empty, we’ve got some work to do. :)
const ignoreFiles = [
  // Very slow files
  'files/amazonawscomdynamodb.yaml',
  'files/amazonawscomelasticmapreduce.yaml',
  'files/amazonawscomemr-containers.yaml',
  'files/amazonawscomec2.yaml',
  'files/amazonawscomdynamodb.yaml',
]

// get the list of files from the storage bucket test-specifications
const files = await fetch(
  'https://storage.googleapis.com/storage/v1/b/test-specifications/o',
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
            console.log('[@mintlify/openapi-parser]', get(newSchema, path))
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
