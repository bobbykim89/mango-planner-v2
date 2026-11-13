import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { readMultipartFormData } from 'h3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAlertStore, useProfileStore } from '@/stores'
import type { ProfileDto } from '#shared/types'
import { clearApiMocks, mockApi, ok, resetState, signIn } from './helpers'

// the real compressor needs a canvas, which happy-dom doesn't have
const { compressMock } = vi.hoisted(() => ({ compressMock: vi.fn() }))
vi.mock('browser-image-compression', () => ({ default: compressMock }))
const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

const profile = (over: Partial<ProfileDto> = {}) =>
  ({ _id: 'pr1', user: 'u1', plansOrder: [], dark: false, profilePicture: 'mango-planner/new', ...over }) as unknown as ProfileDto

const file = (type: string, bytes = 10) =>
  new File([new Uint8Array(bytes)], `picture.${type.split('/')[1] || 'bin'}`, { type })

/** Counts upload requests and keeps the type of the uploaded image part. */
const mockUpload = () => {
  const seen = { calls: 0, type: '' as string | undefined }
  mockApi('PUT', '/api/profile/profile-picture', async (e) => {
    seen.calls++
    const parts = await readMultipartFormData(e)
    seen.type = parts?.find((p) => p.name === 'image')?.type
    return ok(profile())
  })
  return seen
}

describe('profileStore.updateProfilePicture', () => {
  beforeEach(() => {
    resetState()
    signIn()
    compressMock.mockReset()
    // stands in for the compressor: returns a small picture of the requested type
    compressMock.mockImplementation(async (_f: File, opts: { fileType: string }) =>
      new File([new Uint8Array(100)], 'out', { type: opts.fileType }),
    )
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    clearApiMocks()
    vi.restoreAllMocks()
  })

  it('uploads a WebP picture as JPEG', async () => {
    const upload = mockUpload()
    const store = useProfileStore()
    expect(await store.updateProfilePicture(file('image/webp'))).toBe(true)
    expect(compressMock.mock.calls[0]?.[1]).toMatchObject({ fileType: 'image/jpeg' })
    expect(upload.calls).toBe(1)
    expect(upload.type).toBe('image/jpeg')
    expect(store.userProfile?.profilePicture).toBe('mango-planner/new')
    expect(useAlertStore().alert).toBe('Successfully updated profile picture!')
  })

  it('keeps a PNG picture as PNG (transparency)', async () => {
    const upload = mockUpload()
    expect(await useProfileStore().updateProfilePicture(file('image/png'))).toBe(true)
    expect(compressMock.mock.calls[0]?.[1]).toMatchObject({ fileType: 'image/png' })
    expect(upload.type).toBe('image/png')
  })

  it('a picture the browser cannot read shows an alert and uploads nothing', async () => {
    const upload = mockUpload()
    // what the compressor rejects with when the image fails to decode (e.g. HEIC in Chrome)
    compressMock.mockRejectedValue(new Event('error'))
    expect(await useProfileStore().updateProfilePicture(file('image/heic'))).toBe(false)
    expect(upload.calls).toBe(0)
    expect(useAlertStore().alert).toBe(
      "We couldn't read that image. Please choose a JPEG or PNG photo.",
    )
  })

  it('a picture still over 4 MB after shrinking is stopped before upload', async () => {
    const upload = mockUpload()
    compressMock.mockResolvedValue(
      new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'out', { type: 'image/jpeg' }),
    )
    expect(await useProfileStore().updateProfilePicture(file('image/jpeg'))).toBe(false)
    expect(upload.calls).toBe(0)
    expect(useAlertStore().alert).toBe(
      'That image is too large. Please choose one under 4 MB.',
    )
  })
})
