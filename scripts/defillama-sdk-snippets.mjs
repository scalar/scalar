import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const mapEntry = (module, method, args = [], requiresAuth = false) => ({
  module,
  method,
  args,
  requiresAuth,
})

const baseMappings = new Map([
  ['/protocols', mapEntry('tvl', 'getProtocols')],
  ['/protocol/{protocol}', mapEntry('tvl', 'getProtocol', ["'<protocol>'"])],
  ['/v2/historicalChainTvl', mapEntry('tvl', 'getHistoricalChainTvl')],
  ['/v2/historicalChainTvl/{chain}', mapEntry('tvl', 'getHistoricalChainTvl', ["'<chain>'"])],
  ['/tvl/{protocol}', mapEntry('tvl', 'getTvl', ["'<protocol>'"])],
  ['/v2/chains', mapEntry('tvl', 'getChains')],
  ['/tokenProtocols/{symbol}', mapEntry('tvl', 'getTokenProtocols', ["'<symbol>'"], true)],
  [
    '/inflows/{protocol}/{timestamp}',
    mapEntry('tvl', 'getInflows', ["'<protocol>'", '1704067200', '1704153600'], true),
  ],
  ['/chainAssets', mapEntry('tvl', 'getChainAssets', [], true)],
  ['/prices/current/{coins}', mapEntry('prices', 'getCurrentPrices', ["['<coins>']"])],
  ['/prices/historical/{timestamp}/{coins}', mapEntry('prices', 'getHistoricalPrices', ['1704067200', "['<coins>']"])],
  ['/batchHistorical', mapEntry('prices', 'getBatchHistoricalPrices', ["{ '<coins>': [1704067200] }"])],
  ['/chart/{coins}', mapEntry('prices', 'getChart', ["['<coins>']"])],
  ['/percentage/{coins}', mapEntry('prices', 'getPercentageChange', ["['<coins>']"])],
  ['/prices/first/{coins}', mapEntry('prices', 'getFirstPrices', ["['<coins>']"])],
  ['/block/{chain}/{timestamp}', mapEntry('prices', 'getBlockAtTimestamp', ["'<chain>'", '1704067200'])],
  ['/stablecoins', mapEntry('stablecoins', 'getStablecoins')],
  ['/stablecoincharts/all', mapEntry('stablecoins', 'getAllCharts')],
  ['/stablecoincharts/{chain}', mapEntry('stablecoins', 'getChartsByChain', ["'<chain>'"])],
  ['/stablecoin/{asset}', mapEntry('stablecoins', 'getStablecoin', ["'<asset>'"])],
  ['/stablecoinchains', mapEntry('stablecoins', 'getChains')],
  ['/stablecoinprices', mapEntry('stablecoins', 'getPrices')],
  ['/stablecoindominance/{chain}', mapEntry('stablecoins', 'getDominance', ["'<chain>'"], true)],
  ['/pools', mapEntry('yields', 'getPools', [], true)],
  ['/poolsOld', mapEntry('yields', 'getPoolsOld', [], true)],
  ['/chart/{pool}', mapEntry('yields', 'getPoolChart', ["'<pool>'"], true)],
  ['/poolsBorrow', mapEntry('yields', 'getBorrowPools', [], true)],
  ['/chartLendBorrow/{pool}', mapEntry('yields', 'getLendBorrowChart', ["'<pool>'"], true)],
  ['/perps', mapEntry('yields', 'getPerps', [], true)],
  ['/lsdRates', mapEntry('yields', 'getLsdRates', [], true)],
  ['/overview/dexs', mapEntry('volumes', 'getDexOverview')],
  ['/overview/dexs/{chain}', mapEntry('volumes', 'getDexOverviewByChain', ["'<chain>'"])],
  ['/summary/dexs/{protocol}', mapEntry('volumes', 'getDexSummary', ["'<protocol>'"])],
  ['/overview/options', mapEntry('volumes', 'getOptionsOverview')],
  ['/overview/options/{chain}', mapEntry('volumes', 'getOptionsOverviewByChain', ["'<chain>'"])],
  ['/summary/options/{protocol}', mapEntry('volumes', 'getOptionsSummary', ["'<protocol>'"])],
  ['/overview/derivatives', mapEntry('volumes', 'getDerivativesOverview', [], true)],
  ['/summary/derivatives/{protocol}', mapEntry('volumes', 'getDerivativesSummary', ["'<protocol>'"], true)],
  ['/overview/fees', mapEntry('fees', 'getOverview')],
  ['/overview/fees/{chain}', mapEntry('fees', 'getOverviewByChain', ["'<chain>'"])],
  ['/summary/fees/{protocol}', mapEntry('fees', 'getSummary', ["'<protocol>'"])],
  ['/emissions', mapEntry('emissions', 'getAll', [], true)],
  ['/emission/{protocol}', mapEntry('emissions', 'getByProtocol', ["'<protocol>'"], true)],
  ['/categories', mapEntry('ecosystem', 'getCategories', [], true)],
  ['/forks', mapEntry('ecosystem', 'getForks', [], true)],
  ['/oracles', mapEntry('ecosystem', 'getOracles', [], true)],
  ['/hacks', mapEntry('ecosystem', 'getHacks', [], true)],
  ['/raises', mapEntry('ecosystem', 'getRaises', [], true)],
  ['/treasuries', mapEntry('ecosystem', 'getTreasuries', [], true)],
  ['/entities', mapEntry('ecosystem', 'getEntities', [], true)],
  ['/bridges', mapEntry('bridges', 'getAll')],
  ['/bridge/{id}', mapEntry('bridges', 'getById', ['1'])],
  ['/bridgevolume/{chain}', mapEntry('bridges', 'getVolumeByChain', ["'<chain>'"])],
  ['/bridgedaystats/{timestamp}/{chain}', mapEntry('bridges', 'getDayStats', ['1704067200', "'<chain>'"])],
  ['/transactions/{id}', mapEntry('bridges', 'getTransactions', ['1'])],
  ['/snapshot', mapEntry('etfs', 'getOverview', [], true)],
  ['/flows', mapEntry('etfs', 'getHistory', [], true)],
  ['/performance/{period}', mapEntry('etfs', 'getFdvPerformance', ["'30'"], true)],
  ['/institutions', mapEntry('dat', 'getInstitutions', [], true)],
  ['/institutions/{symbol}', mapEntry('dat', 'getInstitution', ["'MSTR'"], true)],
  ['/usage/APIKEY', mapEntry('account', 'getUsage', [], true)],
])

const prefixes = ['/api', '/coins', '/stablecoins', '/bridges', '/yields', '/etfs', '/fdv', '/dat']

const resolveMapping = (path) => {
  if (baseMappings.has(path)) {
    return baseMappings.get(path)
  }
  for (const prefix of prefixes) {
    if (path.startsWith(`${prefix}/`)) {
      const basePath = path.slice(prefix.length)
      if (baseMappings.has(basePath)) {
        return baseMappings.get(basePath)
      }
    }
  }
  return null
}

const buildSnippet = (mapping) => {
  const clientName = mapping.requiresAuth ? 'proClient' : 'client'
  const args = mapping.args.length ? mapping.args.join(', ') : ''
  return `const result = await ${clientName}.${mapping.module}.${mapping.method}(${args})`
}

const updateSpec = (spec, filePath) => {
  const missing = []
  for (const [path, methods] of Object.entries(spec.paths || {})) {
    for (const [method, operation] of Object.entries(methods)) {
      const mapping = resolveMapping(path)
      if (!mapping) {
        missing.push(`${method.toUpperCase()} ${path}`)
        continue
      }
      const existingSamples = Array.isArray(operation['x-codeSamples']) ? operation['x-codeSamples'] : []
      const nextSamples = existingSamples.filter((sample) => sample?.lang !== 'javascript')
      nextSamples.push({
        lang: 'javascript',
        label: 'JavaScript SDK',
        source: buildSnippet(mapping),
      })
      operation['x-codeSamples'] = nextSamples
    }
  }
  if (missing.length) {
    console.log(`${filePath}: ${missing.length} unmapped operations`)
    missing.forEach((entry) => console.log(`${filePath}: ${entry}`))
  } else {
    console.log(`${filePath}: all operations mapped`)
  }
}

const files = [resolve('defillama-openapi-free.json'), resolve('defillama-openapi-pro.json')]

for (const filePath of files) {
  const spec = JSON.parse(await readFile(filePath, 'utf8'))
  updateSpec(spec, filePath)
  await writeFile(filePath, `${JSON.stringify(spec, null, 2)}\n`)
}
