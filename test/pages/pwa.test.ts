import { describe, expect, inject, it } from 'vitest'

// The service worker is generated at build time (@vite-pwa/nuxt + workbox), so
// these read the built sw.js the way a browser would fetch it (#25).
const fetchText = async (path: string) => {
  const res = await fetch(`${inject('baseUrl')}${path}`)
  return { status: res.status, text: await res.text() }
}

describe('offline support', () => {
  it('serves the offline page', async () => {
    const res = await fetchText('/offline.html')
    expect(res.status).toBe(200)
    expect(res.text).toContain("You're offline")
  })

  it('the service worker precaches the offline page', async () => {
    const sw = await fetchText('/sw.js')
    expect(sw.status).toBe(200)
    // under its real URL: static hosting has no clean URL for it
    expect(sw.text).toMatch(/url:\s*"\/offline\.html"/)
  })

  it('page loads go to the network and fall back to the offline page only when that fails', async () => {
    const { text } = await fetchText('/sw.js')
    expect(text).toMatch(/NetworkOnly\(\s*\{\s*plugins:\s*\[\s*new \w+\.PrecacheFallbackPlugin\(\s*\{\s*fallbackURL:\s*"\/offline\.html"/)
    // the old fallback answered every navigation with '/', which is never
    // precached (it's server-rendered), so the service worker threw instead
    expect(text).not.toContain('createHandlerBoundToURL')
  })
})
