import { describe, expect, inject, it } from 'vitest'
import { api, createUser, expectOk } from '../utils/api'

/** Requests a page the way a browser does, without following redirects. */
const page = async (path: string, token?: string) => {
  const headers: Record<string, string> = { accept: 'text/html' }
  if (token) headers.cookie = `access_token=${encodeURIComponent(token)}`
  const res = await fetch(`${inject('baseUrl')}${path}`, {
    headers,
    redirect: 'manual',
  })
  return { status: res.status, headers: res.headers, html: await res.text() }
}

describe('server-rendered pages', () => {
  it.each([
    ['/auth/login', 'Login | Mango Planner'],
    ['/auth/signup', 'Signup | Mango Planner'],
    ['/auth/request', 'Request Reset | Mango Planner'],
    ['/auth/reset-password', 'Reset Password | Mango Planner'],
    ['/about', 'About | Mango Planner'],
    ['/info', 'Info | Mango Planner'],
  ])('renders %s', async (path, title) => {
    const res = await page(path)
    expect(res.status).toBe(200)
    expect(res.html).toContain(title)
    expect(res.html).not.toContain('<title>500')
  })

  it('redirects a guest from / to the login page', async () => {
    const res = await page('/')
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/auth/login')
  })

  it('renders / for a signed-in user with sanitized Markdown', async () => {
    const user = await createUser()
    const created = await api('POST', '/api/plan', {
      token: user.token,
      body: {
        title: 'SSR markdown plan',
        content: '**bold text** <img src=x onerror="alert(1)">',
        type: 'personal',
      },
    })
    expectOk(created)

    const res = await page('/', user.token)
    expect(res.status).toBe(200)
    // the raw content is also in the state payload as JSON; check only the rendered markup
    const markup = res.html.replace(
      /<script[^>]*id="__NUXT_DATA__"[^>]*>[\s\S]*?<\/script>/,
      '',
    )
    expect(markup).toContain('SSR markdown plan')
    expect(markup).toContain('<strong>bold text</strong> <img src="x">')
    expect(markup).not.toContain('onerror')
  })
})
