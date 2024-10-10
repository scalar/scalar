/*global require, exports, process */

/**
 * In case you wonder: This is a CommonJS script, because electron-builder picks it up and expects it to be a CommonJS
 * script with a function as the default export, it seems. It might be possible to switch to ESM, but my first attempt
 * failed.
 *
 * – @hanspagel
 */

require('dotenv').config()
const fs = require('fs')
const { notarize } = require('electron-notarize')

/**
 * Takes a signed app and sends it to Apple to notarize the files.
 */
exports.default = async function notarizing(context) {
  // Basics
  const { electronPlatformName, appOutDir } = context
  const { productFilename: appName } = context.packager.appInfo
  const { appId: appBundleId } = context.packager.appInfo.info._configuration

  console.log()
  console.log('📦 Notarizing the app…')
  console.log()
  console.log('  electronPlatformName:', electronPlatformName)
  console.log('  appOutDir:', appOutDir)
  console.log('  productFilename:', appName)
  console.log('  appBundleId:', appBundleId)

  if (electronPlatformName !== 'darwin') {
    return
  }

  const file = `${appOutDir}/${appName}.app`

  // Check if the file exists
  if (!fs.existsSync(file)) {
    console.log()
    console.error(`❌ Notarization failed. The file does not exist: ${file}`)
    console.log()
    return
  }

  // Environment variables
  const missingEnvironmentVariables = [
    'APPLE_ID',
    'APPLE_ID_PASSWORD',
    'APPLE_TEAM_ID',
  ].filter((variable) => {
    if (!process.env[variable]) {
      console.error(`⚠️ Please provide the ${variable} environment variable.`)
    }

    return !process.env[variable]
  })

  console.log()
  if (missingEnvironmentVariables.length) {
    console.log()
    console.error('❌ Notarization failed. Missing environment variables.')
    console.log()
    return
  } else {
    console.log('🔑 Found all necessary credentials.')
  }

  // Notarization
  console.log()
  console.log('⬆️ Uploading the app to Apple’s notary service…')
  console.log()

  await notarize({
    tool: 'notarytool',
    appBundleId,
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  })

  console.log('✅ The app has been notarized.')
  console.log()
}
