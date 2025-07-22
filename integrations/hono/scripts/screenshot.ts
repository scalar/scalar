import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Waits for the server to be available by attempting to connect to it.
 * Retries up to the specified timeout duration.
 */
async function waitForServer(url: string, timeoutMs: number = 5000): Promise<void> {
  const startTime = Date.now()
  const checkInterval = 500 // Check every 500ms

  console.log(`⏳ Waiting for server at ${url}...`)

  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(1000), // 1 second timeout per request
      })

      if (response.ok) {
        console.log('✅ Server is available!')
        return
      }
    } catch (error) {
      // Server not ready yet, continue waiting
    }

    // Wait before next check
    await new Promise((resolve) => setTimeout(resolve, checkInterval))
  }

  throw new Error(`Server at ${url} did not become available within ${timeoutMs}ms`)
}

/**
 * Screenshot script for the Hono API reference demo.
 * Connects to a running server and captures a screenshot of the main page.
 */
async function takeScreenshot() {
  const PORT = 5054
  const HOST = '0.0.0.0'
  const URL = `http://${HOST}:${PORT}/?api=scalar-galaxy`

  let browser: any = null

  try {
    // Wait for server to be available
    await waitForServer(URL, 5000)

    console.log('🌐 Opening browser...')

    // Launch browser
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()

    // Dark mode
    await page.emulateMedia({ colorScheme: 'dark' })

    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1920, height: 1080 })

    console.log(`📸 Navigating to ${URL}...`)
    await page.goto(URL, { waitUntil: 'networkidle' })

    // Wait a bit for any dynamic content to load
    await page.waitForTimeout(2000)

    // Create screenshots directory if it doesn't exist
    const screenshotsDir = join(__dirname, '../screenshots')
    if (!existsSync(screenshotsDir)) {
      mkdirSync(screenshotsDir, { recursive: true })
    }

    // Take a viewport-only screenshot
    const viewportScreenshotPath = join(screenshotsDir, 'hono-api-reference-viewport.png')
    console.log(`📷 Taking viewport screenshot: ${viewportScreenshotPath}`)
    await page.screenshot({
      path: viewportScreenshotPath,
      fullPage: false,
    })

    console.log('✅ Viewport screenshot saved successfully!')
  } catch (error) {
    console.error('❌ Error taking screenshot:', error)
    process.exit(1)
  } finally {
    // Cleanup
    if (browser) {
      await browser.close()
      console.log('🔒 Browser closed')
    }
  }
}

// Run the screenshot function
takeScreenshot().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
