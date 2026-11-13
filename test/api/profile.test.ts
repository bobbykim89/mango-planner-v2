import { describe, expect, it } from 'vitest'
import { api, createUser, expectError, expectOk, fieldsOf } from '../utils/api'

const newPlanId = async (token: string, title = 'P') => {
  const res = await api('POST', '/api/plan', {
    token,
    body: { title, type: 'personal' },
  })
  expectOk(res)
  return res.json.data._id as string
}

const upload = (token: string, form: FormData) =>
  api('PUT', '/api/profile/profile-picture', { token, raw: form })

describe('profile routes', () => {
  it('returns the profile (get-ok)', async () => {
    const user = await createUser()
    const res = await api('GET', '/api/profile', { token: user.token })
    expectOk(res)
    expect(res.json.data.user).toBe(user.id)
  })

  it('refuses a second profile (create-exists)', async () => {
    const user = await createUser()
    expectError(
      await api('POST', '/api/profile', { token: user.token }),
      409,
      'PROFILE_EXISTS',
    )
  })

  it('saves the plan order (order-ok)', async () => {
    const user = await createUser()
    const a = await newPlanId(user.token, 'a')
    const b = await newPlanId(user.token, 'b')
    const res = await api('PUT', '/api/profile/plans-order', {
      token: user.token,
      body: { plansOrder: [a, b] },
    })
    expectOk(res)
    expect(res.json.data.plansOrder).toEqual([a, b])
    const again = await api('GET', '/api/profile', { token: user.token })
    expect(again.json.data.plansOrder).toEqual([a, b])
  })

  it('drops ids that are not the user’s plans (order-foreign-ids)', async () => {
    const user = await createUser()
    const other = await createUser()
    const mine = await newPlanId(user.token)
    const theirs = await newPlanId(other.token)
    const res = await api('PUT', '/api/profile/plans-order', {
      token: user.token,
      body: { plansOrder: [theirs, mine, '64b7f0f0f0f0f0f0f0f0f0f0'] },
    })
    expectOk(res)
    expect(res.json.data.plansOrder).toEqual([mine])
  })

  it('rejects ids that are not ObjectIds (order-invalid)', async () => {
    const user = await createUser()
    const res = await api('PUT', '/api/profile/plans-order', {
      token: user.token,
      body: { plansOrder: ['nope'] },
    })
    expectError(res, 400, 'VALIDATION_FAILED')
    expect(
      Object.keys(fieldsOf(res)).some((f) => f.startsWith('plansOrder')),
    ).toBe(true)
  })

  it('toggles dark mode (dark-ok)', async () => {
    const user = await createUser()
    const on = await api('PUT', '/api/profile/dark', {
      token: user.token,
      body: { dark: true },
    })
    expectOk(on)
    expect(on.json.data.dark).toBe(true)
    const off = await api('PUT', '/api/profile/dark', {
      token: user.token,
      body: { dark: false },
    })
    expect(off.json.data.dark).toBe(false)
  })

  it('rejects a file that only claims to be an image (upload-fake-type)', async () => {
    const user = await createUser()
    const form = new FormData()
    form.append(
      'image',
      new Blob(['definitely not a png'], { type: 'image/png' }),
      'fake.png',
    )
    expectError(await upload(user.token, form), 415, 'UNSUPPORTED_MEDIA_TYPE')
    const profile = await api('GET', '/api/profile', { token: user.token })
    expect(profile.json.data.profilePicture).toBe('')
  })

  it("rejects files over 4 MB, below Vercel's 4.5 MB request limit (upload-too-large)", async () => {
    const user = await createUser()
    const bytes = new Uint8Array(4 * 1024 * 1024 + 1)
    bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    const form = new FormData()
    form.append('image', new Blob([bytes], { type: 'image/png' }), 'big.png')
    expectError(await upload(user.token, form), 413, 'PAYLOAD_TOO_LARGE')
  })

  it('requires the image field (upload-missing-field)', async () => {
    const user = await createUser()
    const form = new FormData()
    form.append('other', 'x')
    const res = await upload(user.token, form)
    expectError(res, 400, 'VALIDATION_FAILED')
    expect(fieldsOf(res).image).toBeTruthy()
  })
})
