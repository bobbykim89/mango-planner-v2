// Any /api path without a route gets a 404 in the API envelope.
export default defineApiHandler({
  handler: () => {
    throw apiError.NOT_FOUND()
  },
})
