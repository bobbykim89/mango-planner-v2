import nodemailer from 'nodemailer'
import { useRuntimeConfig } from '#imports'
import { createError } from 'h3'

export const sendEmail = async (
  email: string,
  subject: string,
  text: string
) => {
  const config = useRuntimeConfig()
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
  } catch (error) {
    throw createError({
      status: 500,
      message: 'Internal Server Error',
      statusMessage: 'Failed to send email, please try again',
    })
  }
}
