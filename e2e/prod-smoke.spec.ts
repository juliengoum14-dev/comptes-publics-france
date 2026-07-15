import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL
if (!BASE_URL) {
  throw new Error('BASE_URL environment variable is required')
}

test('homepage loads successfully', async ({ page }) => {
  const response = await page.goto(BASE_URL)
  expect(response?.status()).toBe(200)
})

test('homepage has a title', async ({ page }) => {
  await page.goto(BASE_URL)
  const title = await page.title()
  expect(title).toBeTruthy()
})

test('homepage renders content', async ({ page }) => {
  await page.goto(BASE_URL)
  const bodyText = await page.textContent('body')
  expect(bodyText).toBeTruthy()
  expect(bodyText!.length).toBeGreaterThan(10)
})

test('no JavaScript console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  await page.goto(BASE_URL)
  expect(errors).toEqual([])
})
