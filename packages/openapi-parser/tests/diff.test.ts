import SwaggerParser from '@apidevtools/swagger-parser'
import { diff } from 'just-diff'
import { expect, test } from 'vitest'

import { load, normalize } from '../src/index'
import type { AnyObject } from '../src/types'
import { dereference } from '../src/utils/dereference'

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
      message: "Can't resolve URI: ../policies.yaml",
    },
  ],
}

// We can't make a diff for files with circular references. :(
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

// Just skip some files. If it's not empty, we've got some work to do. :)
const ignoreFiles = [
  // Very slow files
  'oas/files/amazonawscomdynamodb.yaml',
  'oas/files/amazonawscomelasticmapreduce.yaml',
  'oas/files/amazonawscomemr-containers.yaml',
  'oas/files/amazonawscomec2.yaml',
  'oas/files/amazonawscomdynamodb.yaml',
]

// get the list of files from the storage bucket scalar-test-fixtures/oas
const files = await fetch('https://storage.googleapis.com/storage/v1/b/scalar-test-fixtures/o')
  .then((response) => response.json())
  .then((data) => data.items as { name: string }[])
  .then((data) =>
    data
      .map((d) => ({ name: d.name }))
      // Only want files in the oas directory that are not on the ignore list
      .filter((d) => d.name.startsWith('oas/') && !ignoreFiles.includes(d.name)),
  )

// Using a subset for now due to performance. The full set can be used for local testing
const set = files.slice(0, 100)

// Batch fetch all the files from storage
const fetched = await Promise.all(
  set.map(async (file) => {
    const content = await fetch(`https://fixtures.staging.scalar.com/${file.name}`)
      .then((r) => r.text())
      .catch(() => '')
    return {
      file: file.name,
      content,
    }
  }),
)

console.log(`[openapi-parser-diff.test.ts] Successfully fetched ${fetched.length} files to test`)

/** This test suite parses a large number of real-world OpenAPI files */
test.concurrent.each(fetched)('diff $file', async ({ file, content }) => {
  const specification = normalize(content)

  const oldSchema = (await new Promise((resolve, reject) => {
    SwaggerParser.dereference(structuredClone(specification) as never, (error, result) => {
      if (error) {
        reject(error)
      }

      if (result === undefined) {
        reject("Couldn't parse the Swagger file.")

        return
      }
      resolve(result)
    })
  }).catch((error) => {
    console.error('[@apidevtools/swagger-parser]', error.message)
  })) as any

  const { filesystem } = await load(structuredClone(specification))
  const { schema: newSchema, errors } = await dereference(filesystem)

  // Errors expected
  if (expectedErrors[file]) {
    expect(errors).toMatchObject(expectedErrors[file])
  }
  // No errors expected
  else {
    // Same number of paths? Or even more?
    expect(Object.keys(oldSchema?.paths ?? {}).length).toBeLessThanOrEqual(Object.keys(newSchema?.paths ?? {}).length)

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
        console.error(`⚠️ DIFFERENCES: Found ${result.length} differences in ${file}`)
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

function get(schema: AnyObject, path: (string | number)[]) {
  return path.reduce((acc, key) => acc[key], schema)
}
