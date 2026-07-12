/*
 * Temporary SEO title patch.
 *
 * The docs platform currently derives the document <title> from the
 * navigation title, so pages like the homepage render as "Introduction"
 * and every product landing page as "Getting Started". This script owns
 * document.title for those routes without touching sidebar labels.
 *
 * Remove once scalar-org#5348 is deployed and the titles move into
 * scalar.config.json head.title (see scalar/scalar#9704).
 */
;(() => {
  const TITLES = {
    '/': 'API interfaces built for developers and agents',
    '/pricing': 'Scalar Pricing — Plans for API Docs, SDKs & MCP Servers',
    '/customers': "Scalar Customers — Trusted by the World's Best API Teams",
    '/products/docs/getting-started': 'Scalar Docs — API Documentation & Developer Docs Platform',
    '/products/agent/getting-started': 'Scalar Agent — Turn OpenAPI into MCP Servers for LLMs',
    '/products/sdks/getting-started': 'Scalar SDK Generator — Generate SDKs from OpenAPI',
    '/products/registry/getting-started': 'Scalar Registry — OpenAPI Document Management & Versioning',
    '/products/api-references/getting-started': 'Scalar API References — Interactive OpenAPI Documentation',
    '/products/api-client/getting-started': 'Scalar API Client — Free, Open-Source API Testing Client',
    '/tools/cli/getting-started': 'Scalar CLI — OpenAPI Tools for Your Terminal',
    '/tools/mock-server/getting-started': 'Scalar Mock Server — Instant Mock APIs from OpenAPI',
    '/tools/openapi-upgrader/getting-started': 'OpenAPI Upgrader — Convert Swagger 2.0 to OpenAPI 3.1',
    '/resources/sso/getting-started': 'SSO & SAML Single Sign-On for Scalar',
    '/resources/migration/swagger-ui': 'Swagger UI Alternative — Migrate to Scalar API References',
  }

  const applyTitle = () => {
    const path = location.pathname.replace(/\/+$/, '') || '/'
    const wanted = TITLES[path]

    // The equality check keeps the observer from looping on our own write.
    if (wanted && document.title !== wanted) {
      document.title = wanted
    }
  }

  // The app resets the title after hydration and on every client-side
  // navigation, so re-apply whenever anything in <head> changes.
  const observer = new MutationObserver(applyTitle)
  observer.observe(document.head, {
    subtree: true,
    childList: true,
    characterData: true,
  })

  window.addEventListener('popstate', applyTitle)
  applyTitle()
})()
