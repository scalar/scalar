import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import sharp from 'sharp'

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
    } catch {
      // Server not ready yet, continue waiting
    }

    // Wait before next check
    await new Promise((resolve) => setTimeout(resolve, checkInterval))
  }

  throw new Error(`Server at ${url} did not become available within ${timeoutMs}ms`)
}

/**
 * Converts a hex color string to RGB values.
 * Supports both 3-digit (#RGB) and 6-digit (#RRGGBB) hex formats.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Remove the # if present
  const cleanHex = hex.replace('#', '')

  // Handle 3-digit hex (#RGB)
  if (cleanHex.length === 3) {
    const r = Number.parseInt(cleanHex[0] + cleanHex[0], 16)
    const g = Number.parseInt(cleanHex[1] + cleanHex[1], 16)
    const b = Number.parseInt(cleanHex[2] + cleanHex[2], 16)
    return { r, g, b }
  }

  // Handle 6-digit hex (#RRGGBB)
  if (cleanHex.length === 6) {
    const r = Number.parseInt(cleanHex.substring(0, 2), 16)
    const g = Number.parseInt(cleanHex.substring(2, 4), 16)
    const b = Number.parseInt(cleanHex.substring(4, 6), 16)
    return { r, g, b }
  }

  // Default to light grey if invalid hex
  return { r: 245, g: 245, b: 245 }
}

/**
 * Adds a grey background frame around the screenshot.
 * Creates a larger canvas with grey background and centers the screenshot on it.
 */
async function addFrameToScreenshot(
  screenshotBuffer: Buffer,
  frameHeight: number = 40,
  frameWidth: number = 60,
  backgroundColor: string = '#f5f5f5',
): Promise<Buffer> {
  // Get the original screenshot dimensions
  const originalImage = sharp(screenshotBuffer)
  const metadata = await originalImage.metadata()

  if (!metadata.width || !metadata.height) {
    throw new Error('Could not determine screenshot dimensions')
  }

  // Calculate new dimensions with frame
  const newWidth = metadata.width + frameWidth * 2
  const newHeight = metadata.height + frameHeight * 2

  // Convert hex color to RGB
  const rgbColor = hexToRgb(backgroundColor)

  // Create a background canvas with the specified color
  const background = sharp({
    create: {
      width: newWidth,
      height: newHeight,
      channels: 4,
      background: { r: rgbColor.r, g: rgbColor.g, b: rgbColor.b, alpha: 1 },
    },
  })

  // Composite the screenshot onto the background, centered
  return background
    .composite([
      {
        input: screenshotBuffer,
        top: frameHeight,
        left: frameWidth,
      },
    ])
    .png()
    .toBuffer()
}

/**
 * Screenshot script for the Hono API reference demo.
 * Connects to a running server and captures a screenshot of the main page with a frame.
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

    // Take a viewport-only screenshot as buffer
    console.log('📷 Taking viewport screenshot...')
    const screenshotBuffer = await page.screenshot({
      fullPage: false,
    })

    // Add frame to the screenshot
    console.log('🖼️ Adding frame to screenshot...')

    const framedScreenshot = await addFrameToScreenshot(screenshotBuffer, 60, 120, '#505052')
    // Save the framed screenshot
    const viewportScreenshotPath = join(screenshotsDir, 'hono-api-reference-viewport.png')
    await sharp(framedScreenshot).toFile(viewportScreenshotPath)

    console.log(`✅ Framed screenshot saved successfully: ${viewportScreenshotPath}`)
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
