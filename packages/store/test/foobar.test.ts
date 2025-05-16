import { normalize, traverse } from '@scalar/openapi-parser'
import { describe, it } from 'vitest'

type UnknownObject = Record<string, unknown>

type DiskEntry = {
  content: Record<string, unknown>
  status: 'pending' | 'fetched'
  references: string[]
}

const createDisk = ({ url }: { url: string }) => {
  let numberOfRequests = 0
  const files = new Map<string, DiskEntry>()

  // Helper function to chunk array into smaller arrays
  const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  // Do the work
  const isReady = async () => {
    await fetchUrl(url)
  }

  // Get the content of a file
  const fetchUrl = async (url: string) => {
    if (files.has(url)) {
      return
    }

    files.set(url, {
      content: {},
      status: 'pending',
      references: [],
    })

    const response = await fetch(url)
    const text = await response.text()

    const content = normalize(text) as UnknownObject

    const references = findReferences(content)

    files.set(url, {
      content,
      references,
      status: 'fetched',
    })

    numberOfRequests++
    console.log(`✅ #${numberOfRequests} ${url}`)

    // Fetch references in chunks of 5
    const chunks = chunkArray(references, 5)
    for (const chunk of chunks) {
      await Promise.all(chunk.map((reference) => fetchUrl(reference)))
    }

    return
  }

  const findReferences = (content: UnknownObject) => {
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

    return references
  }

  return { isReady, files }
}

function getAbsoluteUrl(source: string, url: string) {
  return new URL(url, source).toString()
}

describe('createDisk', () => {
  it('fetches all references', async () => {
    const { isReady, files } = createDisk({
      url: 'https://raw.githubusercontent.com/digitalocean/openapi/refs/heads/main/specification/DigitalOcean-public.v2.yaml',
    })

    await isReady()

    // Output all URLs
    console.log(Array.from(files.keys()))
  }, 30000)
})
