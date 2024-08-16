import GithubSlugger from 'github-slugger'
import fs from 'node:fs'

const slugger = new GithubSlugger()

/**
 * Downloads a list of over 2000 real-world Swagger APIs from apis.guru,
 * and applies some custom filtering logic to it.
 */

console.log('Fetch list of APIs from apis.guru…')
const apis = await fetchApiList()

console.log(`✓ Received a list of ${apis.length} APIs from apis.guru.`)

console.log()
console.log('Start downloading …')

// Fetch files one after the other
for (const api of apis) {
  console.log()
  console.log(`Fetching ${api.swaggerYamlUrl}`)

  const response = await fetch(api.swaggerYamlUrl)

  if (!response.ok) {
    console.error(`❌ [ERROR] Failed to fetch ${api.swaggerYamlUrl}`)
    continue
  }

  const content = await response.text()

  const filename = `${slugger.slug(api.name)}.yaml`
  const file = `./tests/files/${filename}`

  console.log('✅ [OK] Writing to ', file)
  fs.writeFile(file, content, (err) => {
    if (err) {
      throw err
    }
  })
}

export async function fetchApiList() {
  const response = await fetch('https://api.apis.guru/v2/list.json')

  if (!response.ok) {
    throw new Error('Unable to downlaod real-world APIs from apis.guru')
  }

  const apiMap = await response.json()

  deleteProblematicAPIs(apiMap)
  const apiArray = flatten(apiMap)

  return apiArray
}

/**
 * Removes certain APIs that are known to cause problems
 */
function deleteProblematicAPIs(apiList) {
  // TODO:
  // GitHub's CORS policy blocks this request
  delete apiList['googleapis.com:adsense']

  // These APIs cause infinite loops in json-schema-ref-parser.  Still investigating.
  // https://github.com/APIDevTools/json-schema-ref-parser/issues/56
  delete apiList['bungie.net']
  delete apiList['stripe.com']
  delete apiList['docusign.net']
  delete apiList['kubernetes.io']
  delete apiList['microsoft.com:graph']

  // hangs
  delete apiList['presalytics.io:ooxml']

  // base security declaration in path/get operation (error message below)
  // "type array but found type null at #/paths//vault/callback/get/security"
  delete apiList['apideck.com:vault']
}

/**
 * Flattens the API object structure into an array containing all versions of all APIs.
 */
function flatten(apimap) {
  const apiArray: {
    name: string
    version: string
    swaggerYamlUrl: string
  }[] = []

  for (const [name, api] of Object.entries(apimap)) {
    const latestVersion = api.versions[api.preferred]

    apiArray.push({
      name,
      version: api.preferred,
      swaggerYamlUrl: latestVersion.swaggerYamlUrl,
    })
  }

  return apiArray
}
