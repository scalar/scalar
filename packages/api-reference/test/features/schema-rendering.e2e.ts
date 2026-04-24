import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

import { sources } from '../utils/sources'

const modelNames = sources.find((source) => source.slug === 'model-names')?.content

test.describe('schema rendering', () => {
  test('renders model properties with correct names and types', async ({ page }) => {
    const example = await serveExample({ content: modelNames })

    await page.goto(`${example}#models`)
    await page.setViewportSize({ width: 800, height: 600 })

    const modelsRegion = page.getByRole('region', { name: 'Models' })
    await expect(modelsRegion).toBeVisible()

    await modelsRegion.getByRole('button', { name: 'VehicleModel' }).click()
    const vehicleModel = modelsRegion.getByRole('region', { name: 'VehicleModel' })

    await expect(vehicleModel.getByText('Id', { exact: true })).toBeVisible()
    await expect(vehicleModel.getByText('Name', { exact: true })).toBeVisible()
    await expect(vehicleModel.getByText('Make', { exact: true })).toBeVisible()
    await expect(vehicleModel.getByText('Year', { exact: true })).toBeVisible()
    await expect(vehicleModel.getByText('LicensePlate', { exact: true })).toBeVisible()

    await expect(vehicleModel).toHaveScreenshot('vehicle-model-properties.png')
  })

  test('renders nested $ref schemas inline', async ({ page }) => {
    const example = await serveExample({ content: modelNames })

    await page.goto(`${example}#models`)
    await page.setViewportSize({ width: 800, height: 600 })

    const modelsRegion = page.getByRole('region', { name: 'Models' })
    await modelsRegion.getByRole('button', { name: 'VehicleModel' }).click()
    const vehicleModel = modelsRegion.getByRole('region', { name: 'VehicleModel' })

    await expect(vehicleModel.getByText('Address', { exact: true })).toBeVisible()
    await expect(vehicleModel.getByText('Services', { exact: true })).toBeVisible()

    await expect(vehicleModel).toHaveScreenshot('vehicle-model-refs.png')
  })

  test('renders all models from the document', async ({ page }) => {
    const example = await serveExample({ content: modelNames })

    await page.goto(`${example}#models`)
    await page.setViewportSize({ width: 800, height: 600 })

    const modelsRegion = page.getByRole('region', { name: 'Models' })
    await expect(modelsRegion).toBeVisible()

    await expect(modelsRegion.getByRole('button', { name: 'VehicleAddressModel' })).toBeVisible()
    await expect(modelsRegion.getByRole('button', { name: 'VehicleModel' })).toBeVisible()
    await expect(modelsRegion.getByRole('button', { name: 'VehicleServiceModel' })).toBeVisible()

    await expect(modelsRegion).toHaveScreenshot('all-models-collapsed.png')
  })

  test('expands nested object children', async ({ page }) => {
    const example = await serveExample({ content: modelNames })

    await page.goto(`${example}#models`)
    await page.setViewportSize({ width: 800, height: 600 })

    const modelsRegion = page.getByRole('region', { name: 'Models' })
    await modelsRegion.getByRole('button', { name: 'VehicleModel' }).click()
    const vehicleModel = modelsRegion.getByRole('region', { name: 'VehicleModel' })

    const addressToggle = vehicleModel.getByRole('button', { name: 'Address', exact: true })
    await expect(addressToggle).toBeVisible()
    await addressToggle.click()

    await expect(vehicleModel.getByText('AddressLine1', { exact: true })).toBeVisible()
    await expect(vehicleModel.getByText('City', { exact: true })).toBeVisible()
    await expect(vehicleModel.getByText('PostCode', { exact: true })).toBeVisible()

    await expect(vehicleModel).toHaveScreenshot('vehicle-model-nested-expanded.png')
  })
})
