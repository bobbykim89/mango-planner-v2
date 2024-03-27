import { H3Event, readMultipartFormData, createError } from 'h3'

export const readFormDataText = async (e: H3Event, key: string = 'content') => {
  const body = await readMultipartFormData(e)

  if (!body) {
    throw createError({
      status: 404,
      message: 'Not found',
      statusMessage: 'Request body not found, please try again',
    })
  }

  const content = body.find((item) => {
    return item.name === key
  })

  if (!content) {
    throw createError({
      status: 404,
      message: 'Not found',
      statusMessage: 'Content field not found',
    })
  }

  const decodedContent = Buffer.from(content.data).toString()

  e.context[key] = decodedContent
}
