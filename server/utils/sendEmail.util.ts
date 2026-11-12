import { useRuntimeConfig } from '#imports'
import nodemailer from 'nodemailer'

/**
 * Sends a plain-text email. In development, and when mailerTransport is 'log'
 * (tests), it writes the message to the server log instead of sending it.
 */
export const sendEmail = async (
  email: string,
  subject: string,
  text: string,
) => {
  const config = useRuntimeConfig()
  if (import.meta.dev || config.mailerTransport === 'log') {
    console.info(`[mail] to=${email} text=${text.replace(/\n/g, '\\n')}`)
    return
  }
  try {
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: config.mailerEmailAddress,
        pass: config.mailerAppPassword,
      },
    })
    await transporter.sendMail({
      from: config.mailerEmailAddress,
      to: email,
      subject,
      text,
    })
  } catch (err) {
    console.error('[mail] failed to send:', err)
    throw apiError.UPSTREAM_ERROR(
      "We couldn't send the email right now. Please try again later.",
    )
  }
}
