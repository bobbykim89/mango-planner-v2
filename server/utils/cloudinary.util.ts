import { useRuntimeConfig } from '#imports'
import { v2 as cloudinary } from 'cloudinary'
import { getRequestHeader, readMultipartFormData, type H3Event } from 'h3'

const config = useRuntimeConfig()

cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
})

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
// room for the multipart boundaries and headers around the file
const MULTIPART_OVERHEAD = 64 * 1024

const sniffImage = (data: Buffer): 'image/jpeg' | 'image/png' | null => {
  if (
    data.length >= 3 &&
    data[0] === 0xff &&
    data[1] === 0xd8 &&
    data[2] === 0xff
  )
    return 'image/jpeg'
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (data.length >= png.length && png.every((b, i) => data[i] === b))
    return 'image/png'
  return null
}

/** Reads one image from a multipart body and checks its size and real type (by its first bytes). */
export const readImageUpload = async (
  e: H3Event,
  key = 'image',
): Promise<{ data: Buffer; mime: 'image/jpeg' | 'image/png' }> => {
  const length = Number(getRequestHeader(e, 'content-length') ?? 0)
  if (length > MAX_IMAGE_BYTES + MULTIPART_OVERHEAD) {
    throw apiError.PAYLOAD_TOO_LARGE()
  }
  let parts: Awaited<ReturnType<typeof readMultipartFormData>>
  try {
    parts = await readMultipartFormData(e)
  } catch {
    throw apiError.BAD_REQUEST()
  }
  const file = parts?.find((part) => part.name === key)
  if (!file || !file.data?.length) {
    throw apiError.VALIDATION_FAILED(undefined, [
      { field: key, message: 'Please choose an image to upload.' },
    ])
  }
  if (file.data.length > MAX_IMAGE_BYTES) throw apiError.PAYLOAD_TOO_LARGE()
  const mime = sniffImage(file.data)
  if (!mime) throw apiError.UNSUPPORTED_MEDIA_TYPE()
  return { data: file.data, mime }
}

/** Uploads an image to Cloudinary and returns its public id. */
export const uploadImage = async (file: {
  data: Buffer
  mime: string
}): Promise<string> => {
  try {
    const dataUri = `data:${file.mime};base64,${file.data.toString('base64')}`
    const { public_id } = await cloudinary.uploader.upload(dataUri, {
      folder: 'mango-planner',
    })
    return public_id
  } catch (err) {
    console.error('[cloudinary] upload failed:', err)
    throw apiError.UPSTREAM_ERROR(
      "We couldn't upload your picture right now. Please try again later.",
    )
  }
}

export const deleteCloudinaryImage = async (id: string): Promise<void> => {
  await cloudinary.uploader.destroy(id)
}
