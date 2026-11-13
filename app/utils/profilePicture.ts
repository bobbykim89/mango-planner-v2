import imageCompression from 'browser-image-compression'

/** Kept below Vercel's 4.5 MB request limit; the server enforces the same cap. */
export const MAX_PICTURE_BYTES = 4 * 1024 * 1024

/**
 * Shrinks a picture for upload and converts it to a type the server accepts:
 * PNG stays PNG (keeps transparency), anything else becomes JPEG (WebP, AVIF, ...).
 * Throws an Error with a message for the user when the picture can't be used.
 */
export const prepareProfilePicture = async (file: File): Promise<File> => {
  let picture: File
  try {
    picture = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1000,
      useWebWorker: true,
      fileType: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
    })
  } catch (err) {
    // the browser couldn't decode it, e.g. an iPhone HEIC photo outside Safari
    console.error('Failed to prepare picture:', err)
    throw new Error(
      "We couldn't read that image. Please choose a JPEG or PNG photo.",
    )
  }
  if (picture.size > MAX_PICTURE_BYTES) {
    throw new Error('That image is too large. Please choose one under 4 MB.')
  }
  return picture
}
