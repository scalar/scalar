import { normalize, traverse } from '@scalar/openapi-parser'
import { describe, it } from 'vitest'

type UnknownObject = Record<string, unknown>

type DiskEntry = {
  content: Record<string, unknown>
}

const createDisk = ({ url }: { url: string }) => {
  const files = new Map<string, DiskEntry>()

  // Do the work
  const isReady = async () => {
    await get(url)
  }

  // Get the content of a file
  const get = async (url: string) => {
    if (files.has(url)) {
      return
    }

    files.set(url, {
      content: {},
    })

    const response = await fetch(url)
    const text = await response.text()

    const content = normalize(text) as UnknownObject

    // TODO: Error handling

    files.set(url, {
      content,
    })

    findNewReferences(content)
  }

  const findNewReferences = (content: UnknownObject) => {
    const references: string[] = []

    traverse(content, (value: any) => {
      if (!value.$ref || typeof value.$ref !== 'string' || value.$ref.startsWith('#')) {
        return value
      }

      const reference = value.$ref.split('#')[0]
      const absoluteUrl = getAbsoluteUrl(url, reference)

      references.push(absoluteUrl)

      return value
    })

    console.log(references)
  }

  return { isReady, files }
}

function getAbsoluteUrl(source: string, url: string) {
  return new URL(url, source).toString()
}

describe('foobar', () => {
  it('should be true', async () => {
    const { isReady, files } = createDisk({
      url: 'https://raw.githubusercontent.com/digitalocean/openapi/refs/heads/main/specification/DigitalOcean-public.v2.yaml',
    })

    await isReady()

    // Output all URLs
    console.log(Array.from(files.keys()))
  })
})
