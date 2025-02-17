import type { Item } from '../types'

/**
 * Extracts expected status codes from the test scripts of a Postman item.
 * Looks for patterns like:
 * - pm.response.to.have.status(201)
 * - pm.expect(pm.response.code).to.eql(202)
 * - pm.expect(pm.response.status).to.equal(201)
 */
export function extractStatusCodesFromTests(item: Item): number[] {
  const statusCodes: number[] = []

  if (item.event?.length) {
    item.event.forEach((event) => {
      if (event.listen === 'test' && event.script?.exec) {
        const scriptLines = Array.isArray(event.script.exec) ? event.script.exec : [event.script.exec]

        scriptLines.forEach((line: string) => {
          const statusCode = parseStatusCodeFromLine(line)
          if (statusCode) {
            statusCodes.push(statusCode)
          }
        })
      }
    })
  }

  return statusCodes
}

/**
 * Parses a line of script to extract a status code.
 * Supports patterns like:
 * - pm.response.to.have.status(201)
 * - pm.expect(pm.response.code).to.eql(202)
 * - pm.expect(pm.response.status).to.equal(201)
 */
function parseStatusCodeFromLine(line: string): number | null {
  const patterns = [
    /pm\.response\.to\.have\.status\((\d{3})\)/,
    /pm\.expect\(pm\.response\.code\)\.to\.(?:eql|equal)\((\d{3})\)/,
    /pm\.expect\(pm\.response\.status\)\.to\.(?:eql|equal)\(['"](\d{3})['"]\)/,
  ]

  for (const pattern of patterns) {
    const match = pattern.exec(line)?.at(1)
    if (match) {
      return Number.parseInt(match, 10)
    }
  }

  return null
}
