import { v2 as cloudinary } from 'cloudinary'
import { H3Event, readMultipartFormData, createError } from 'h3'
import { useRuntimeConfig } from '#imports'

const config = useRuntimeConfig()

cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
})

export const uploadCloudinary = async (e: H3Event, key: string = 'image') => {
  const body = await readMultipartFormData(e)
  if (!body) {
    throw createError({
      status: 404,
      message: 'Not found',
      statusMessage: 'Request body not found, please try again',
    })
  }
  const file = body.find((item) => {
    return item.name === key
  })
  if (!file) {
    throw createError({
      status: 404,
      message: 'Not found',
      statusMessage: 'File not found',
    })
  }
  if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
    throw createError({
      status: 415,
      message: 'Unsupported media type',
      statusMessage:
        'Unsupported media type please check if file has png or jpeg format',
    })
  }
  const base64EncodedImage = Buffer.from(file.data).toString('base64')
  const dataUri = `data:${file.type};base64,${base64EncodedImage}`

  const { public_id } = await cloudinary.uploader.upload(dataUri, {
    folder: 'mango-planner',
  })

  e.context.file = { imageId: public_id }
}

export const deleteCloudinaryImage = async (id: string): Promise<void> => {
  await cloudinary.uploader.destroy(id)
}
