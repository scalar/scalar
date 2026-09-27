/**
 * Adds schema.org JSON-LD to scalar.com pages.
 *
 * Scalar Docs does not emit structured data yet, so we build it in the
 * browser from what the page already shows: the path, the H1, the italic
 * "Last updated" and byline lines under it, and the rendered
 * <scalar-detail> FAQ items. Google renders JavaScript before indexing, so
 * this is picked up by Search. Crawlers that do not run JavaScript (most AI
 * bots) will not see it; server-side JSON-LD is on the platform wish list.
 *
 * Everything lives in one <script type="application/ld+json"> tag with a
 * stable id. On client-side navigation we rebuild the graph and only touch
 * the tag when the output changes, so the script is safe to run repeatedly.
 *
 * The builders at the top are pure (no DOM access) so they can be tested in
 * Node, see the export at the bottom.
 */
;(() => {
  const SITE = 'https://scalar.com'
  const SCRIPT_ID = 'scalar-structured-data'
  const ORG_ID = `${SITE}/#organization`
  const WEBSITE_ID = `${SITE}/#website`

  const ORGANIZATION = {
    '@type': 'Organization',
    '@id': ORG_ID,
    'name': 'Scalar',
    'url': `${SITE}/`,
    'logo': {
      '@type': 'ImageObject',
      'url': `${SITE}/brand/scalar-logomark-light.png`,
    },
    'sameAs': [
      'https://github.com/scalar/scalar',
      'https://twitter.com/scalar',
      'https://www.linkedin.com/company/scalar-org',
      'https://discord.gg/scalar',
    ],
  }

  const WEBSITE = {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    'name': 'Scalar',
    'url': `${SITE}/`,
    'publisher': { '@id': ORG_ID },
    'inLanguage': 'en',
  }

  /**
   * One entry per product section under /products. Only the MIT-licensed
   * open-source products carry a zero-price offer, because that price is a
   * fact for everyone. Paid plans are left out on purpose: pricing is still
   * moving, and we do not want a stale number frozen into rich results.
   * No aggregateRating until there are real, first-party reviews to cite.
   */
  const PRODUCTS = {
    'api-references': {
      name: 'Scalar API Reference',
      category: 'DeveloperApplication',
      os: 'Web',
      free: true,
    },
    'api-client': {
      name: 'Scalar API Client',
      category: 'DeveloperApplication',
      os: 'Web, Windows, macOS, Linux',
      free: true,
    },
    'docs': { name: 'Scalar Docs', category: 'DeveloperApplication', os: 'Web' },
    'sdk-generator': { name: 'Scalar SDK Generator', category: 'DeveloperApplication', os: 'Web' },
    'registry': { name: 'Scalar Registry', category: 'DeveloperApplication', os: 'Web' },
    'agent': { name: 'Scalar Agent', category: 'DeveloperApplication', os: 'Web' },
  }

  /** Path prefixes that get an Article node. */
  const ARTICLE_PREFIXES = [
    '/learn/',
    '/blog/',
    '/alternatives/',
    '/library/',
    '/resources/compare/',
    '/resources/migration/',
    '/resources/stainless-wind-down',
    '/docs-for/',
    '/sdk/',
  ]

  /**
   * Paths that exist as real pages and are therefore safe to link from a
   * breadcrumb. Intermediate segments that 404 (like /resources or
   * /blog/posts) are skipped rather than linked. Keep this in sync when a new
   * hub page ships.
   */
  const HUB_PATHS = new Set([
    '/blog',
    '/customers',
    '/products',
    '/products/agent',
    '/products/api-client',
    '/products/api-references',
    '/products/docs',
    '/products/registry',
    '/products/sdk-generator',
    '/resources/changelog',
    '/resources/compare',
    '/resources/migration',
    '/learn',
    '/learn/openapi',
    '/learn/sdk',
    '/learn/mcp',
    '/alternatives',
    '/library',
    '/docs-for',
    '/sdk',
  ])

  /** Segment labels that title-casing would get wrong. */
  const SEGMENT_LABELS = {
    'api-references': 'API References',
    'api-client': 'API Client',
    'sdk-generator': 'SDK Generator',
    'sdk': 'SDK',
    'mcp': 'MCP',
    'openapi': 'OpenAPI',
    'docs-for': 'Docs for',
    'docs': 'Docs',
  }

  const MONTHS = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ]

  /** Normalise a path: no query, no hash, no trailing slash (except root). */
  const normalizePath = (path) => {
    const clean = String(path || '/')
      .split(/[?#]/)[0]
      .replace(/\/index(\.md)?$/, '')
      .replace(/\/+$/, '')
    return clean === '' ? '/' : clean
  }

  const labelForSegment = (segment) =>
    SEGMENT_LABELS[segment] ||
    segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

  const pad = (n) => String(n).padStart(2, '0')

  /**
   * Turn a human date into ISO 8601. Accepts "September 2026",
   * "26 September 2026", "September 26, 2026" and "2026-09-26". A month-only
   * input returns month precision ("2026-09"), which is valid ISO 8601; we do
   * not invent a day that the page does not state.
   */
  const parseHumanDate = (text) => {
    if (!text) return null
    const value = String(text).trim()

    const iso = value.match(/\b(\d{4})-(\d{2})(?:-(\d{2}))?\b/)
    if (iso) return iso[3] ? `${iso[1]}-${iso[2]}-${iso[3]}` : `${iso[1]}-${iso[2]}`

    const lower = value.toLowerCase()
    const monthIndex = MONTHS.findIndex((m) => lower.includes(m))
    const year = lower.match(/\b(20\d{2})\b/)
    if (monthIndex === -1 || !year) return null

    const month = pad(monthIndex + 1)
    const day = lower.replace(year[1], '').match(/\b(\d{1,2})\b/)
    return day ? `${year[1]}-${month}-${pad(day[1])}` : `${year[1]}-${month}`
  }

  /** Pull the date out of a line like "Last updated: September 2026". */
  const parseLastUpdated = (line) => {
    const match = String(line || '').match(/last\s+updated\s*:?\s*(.+)$/i)
    return match ? parseHumanDate(match[1]) : null
  }

  /**
   * Pull the author out of "By Marc Laventure · Reviewed by: pending".
   * Returns null when there is no byline, so the Article falls back to the
   * Organization as author rather than naming someone who did not write it.
   */
  const parseByline = (line) => {
    const match = String(line || '').match(/^\s*by\s+([^·|•\n]+?)\s*(?:[·|•]|$)/i)
    if (!match) return null
    const name = match[1].trim()
    if (!name || /^(scalar|the scalar team)$/i.test(name)) return null

    const reviewer = String(line).match(/reviewed\s+by\s*:?\s*([^·|•\n]+)/i)
    const reviewedBy = reviewer ? reviewer[1].trim() : null
    return {
      author: name,
      reviewedBy: reviewedBy && !/^pending$/i.test(reviewedBy) ? reviewedBy : null,
    }
  }

  /** Blog posts live at /blog/posts/YYYY-MM-DD-slug, so the date is in the URL. */
  const dateFromBlogPath = (path) => {
    const match = normalizePath(path).match(/^\/blog\/posts\/(\d{4}-\d{2}-\d{2})-/)
    return match ? match[1] : null
  }

  const isArticlePath = (path) => {
    const normalized = normalizePath(path)
    return ARTICLE_PREFIXES.some((prefix) => normalized.startsWith(prefix))
  }

  const productForPath = (path) => {
    const match = normalizePath(path).match(/^\/products\/([^/]+)/)
    return match && PRODUCTS[match[1]] ? { slug: match[1], ...PRODUCTS[match[1]] } : null
  }

  /** Build a BreadcrumbList from the path, skipping segments without a page. */
  const buildBreadcrumbs = (path, currentTitle) => {
    const normalized = normalizePath(path)
    if (normalized === '/') return null

    const segments = normalized.slice(1).split('/')
    const items = [{ name: 'Home', url: `${SITE}/` }]
    segments.forEach((segment, index) => {
      const partial = `/${segments.slice(0, index + 1).join('/')}`
      const isLast = index === segments.length - 1
      if (isLast) {
        items.push({ name: currentTitle || labelForSegment(segment), url: `${SITE}${partial}` })
      } else if (HUB_PATHS.has(partial)) {
        items.push({ name: labelForSegment(segment), url: `${SITE}${partial}` })
      }
    })

    if (items.length < 2) return null
    return {
      '@type': 'BreadcrumbList',
      'itemListElement': items.map((item, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': item.name,
        'item': item.url,
      })),
    }
  }

  const buildFaqPage = (faqs, url) => {
    const questions = (faqs || []).filter((faq) => faq && faq.question && faq.answer)
    if (!questions.length) return null
    return {
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      'mainEntity': questions.map((faq) => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': { '@type': 'Answer', 'text': faq.answer },
      })),
    }
  }

  /**
   * Build the full @graph for one page.
   *
   * @param {object} page
   * @param {string} page.path        location.pathname
   * @param {string} [page.title]     the H1 text (falls back to document title)
   * @param {string} [page.description] meta description
   * @param {string} [page.lastUpdated] the "Last updated: …" line, if any
   * @param {string} [page.byline]    the "By …" line, if any
   * @param {Array<{question: string, answer: string}>} [page.faqs]
   * @param {string} [page.image]     og:image URL
   * @param {boolean} [page.notFound] true on the platform 404 page
   * @returns {object} a JSON-LD document
   */
  const buildGraph = (page) => {
    const path = normalizePath(page.path)
    const url = path === '/' ? `${SITE}/` : `${SITE}${path}`
    const title = (page.title || '').trim()
    const graph = [ORGANIZATION, WEBSITE]

    if (page.notFound) {
      return { '@context': 'https://schema.org', '@graph': graph }
    }

    const product = productForPath(path)
    if (product) {
      const app = {
        '@type': 'SoftwareApplication',
        '@id': `${SITE}/products/${product.slug}#software`,
        'name': product.name,
        'applicationCategory': product.category,
        'operatingSystem': product.os,
        'url': `${SITE}/products/${product.slug}`,
        'publisher': { '@id': ORG_ID },
      }
      if (product.free) {
        app.offers = { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }
        app.license = 'https://opensource.org/licenses/MIT'
      }
      // Only describe the product on its own landing page, where the
      // description is about the product rather than a sub-topic.
      if (path === `/products/${product.slug}` && page.description) {
        app.description = page.description
      }
      graph.push(app)
    }

    if (isArticlePath(path) && title) {
      const byline = parseByline(page.byline)
      const modified = parseLastUpdated(page.lastUpdated)
      const published = dateFromBlogPath(path)
      const article = {
        '@type': path.startsWith('/blog/') ? 'BlogPosting' : 'Article',
        '@id': `${url}#article`,
        'headline': title.length > 110 ? `${title.slice(0, 107)}...` : title,
        'mainEntityOfPage': url,
        'url': url,
        'inLanguage': 'en',
        'isPartOf': { '@id': WEBSITE_ID },
        'publisher': { '@id': ORG_ID },
        'author': byline ? { '@type': 'Person', 'name': byline.author } : { '@id': ORG_ID },
      }
      if (page.description) article.description = page.description
      if (page.image) article.image = page.image
      if (published) article.datePublished = published
      if (modified || published) article.dateModified = modified || published
      graph.push(article)
    }

    const faq = buildFaqPage(page.faqs, url)
    if (faq) graph.push(faq)

    const breadcrumbs = buildBreadcrumbs(path, title)
    if (breadcrumbs) graph.push(breadcrumbs)

    return { '@context': 'https://schema.org', '@graph': graph }
  }

  // ---------------------------------------------------------------------------
  // Browser glue
  // ---------------------------------------------------------------------------

  const collapse = (text) =>
    String(text || '')
      .replace(/\s+/g, ' ')
      .trim()

  /** Read the page the way a visitor sees it. */
  const readPage = () => {
    const h1 = document.querySelector('main h1, h1')
    const title = collapse(h1 ? h1.textContent : document.title)

    // The italic "Last updated" and byline lines sit directly under the H1.
    // Look at the first few paragraphs only, so a quoted "Last updated" further
    // down the page cannot leak in.
    let lastUpdated = null
    let byline = null
    // The H1 is sometimes wrapped in a flex row, so climb to the page node
    // that holds both the heading and the paragraphs under it.
    const container = h1 ? h1.closest('.page-node') || h1.parentElement : null
    const paragraphs = container ? Array.from(container.querySelectorAll(':scope > p')).slice(0, 4) : []
    for (const p of paragraphs) {
      const text = collapse(p.textContent)
      if (!lastUpdated && /^last\s+updated/i.test(text)) lastUpdated = text
      else if (!byline && /^by\s+/i.test(text)) byline = text
    }

    // <scalar-detail title="…"> renders as details.t-editor__detail. Steps use
    // a different class (t-editor__step), so they are not mistaken for FAQs.
    // Scope to the page content so nothing in the header or sidebar counts.
    const content = (h1 && h1.closest('.content')) || document.querySelector('main') || document
    const faqs = Array.from(content.querySelectorAll('details.t-editor__detail'))
      .map((detail) => ({
        question: collapse(detail.querySelector('.t-editor__detail-title')?.textContent),
        answer: collapse(detail.querySelector('.t-editor__detail-content')?.textContent),
      }))
      .filter((faq) => faq.question.endsWith('?') && faq.answer)

    const meta = (selector) => document.querySelector(selector)?.getAttribute('content') || undefined

    return {
      path: window.location.pathname,
      title,
      description: meta('meta[name="description"]'),
      image: meta('meta[property="og:image"]'),
      lastUpdated,
      byline,
      faqs,
      notFound: /^page not found/i.test(title),
    }
  }

  const render = () => {
    const json = JSON.stringify(buildGraph(readPage()))
    let tag = document.getElementById(SCRIPT_ID)
    if (tag && tag.textContent === json) return
    if (!tag) {
      tag = document.createElement('script')
      tag.type = 'application/ld+json'
      tag.id = SCRIPT_ID
      document.head.appendChild(tag)
    }
    tag.textContent = json
  }

  const start = () => {
    render()
    // The platform swaps page content on client-side navigation without a
    // full reload. Watch the body (our tag lives in <head>, so we never
    // trigger ourselves) and coalesce bursts of mutations into one frame.
    let queued = false
    new MutationObserver(() => {
      if (queued) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        render()
      })
    }).observe(document.body, { childList: true, subtree: true })
  }

  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start)
    } else {
      start()
    }
  }

  // Expose the pure builders to Node for testing. Browsers skip this.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      buildGraph,
      buildBreadcrumbs,
      buildFaqPage,
      parseByline,
      parseHumanDate,
      parseLastUpdated,
      dateFromBlogPath,
      normalizePath,
      isArticlePath,
      productForPath,
    }
  }
})()
