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

  test('lets a later allOf member override the description and title (#6974)', async ({ page }) => {
    const example = await serveExample({
      content: {
        openapi: '3.1.0',
        info: { title: 'allOf override', version: '1.0' },
        paths: {},
        components: {
          schemas: {
            UserBase: {
              type: 'object',
              title: 'BaseUser',
              description: 'Base user information',
              properties: {
                id: { type: 'integer', description: 'Unique user ID' },
                email: { type: 'string', description: 'User email address' },
              },
            },
            User: {
              title: 'UserDetailsHeader',
              allOf: [
                { $ref: '#/components/schemas/UserBase' },
                {
                  type: 'object',
                  title: 'UserDetails',
                  description: 'Full user information',
                  properties: { address: { type: 'string', description: 'Street address' } },
                },
              ],
            },
          },
        },
      },
    })

    await page.goto(`${example}#models`)
    await page.setViewportSize({ width: 800, height: 600 })

    const modelsRegion = page.getByRole('region', { name: 'Models' })
    // The top-level title takes precedence over the allOf members
    await modelsRegion.getByRole('button', { name: 'UserDetailsHeader' }).click()

    // The later allOf member overrides the referenced base description
    await expect(modelsRegion.getByText('Full user information')).toBeVisible()
    await expect(modelsRegion.getByText('Base user information')).toHaveCount(0)

    await expect(modelsRegion).toHaveScreenshot('allof-description-override.png')
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
