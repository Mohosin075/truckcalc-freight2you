import { Resend } from 'resend'
import config from '../config'
import { ISendEmail } from '../interfaces/email'

const resend = new Resend(config.email.resend_api_key)

const sendEmail = async (values: ISendEmail) => {
  try {
    const fromAddress = config.email.from
      ? config.email.from.includes('<')
        ? config.email.from
        : `TruckCalc <${config.email.from}>`
      : 'TruckCalc <onboarding@resend.dev>'

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: values.to,
      subject: values.subject,
      html: values.html,
    })

    if (error) {
      console.error('Resend email error:', error)
      return
    }

    console.log('Mail sent successfully via Resend:', data)
  } catch (error) {
    console.error('Email sending error:', error)
  }
}

export const emailHelper = {
  sendEmail,
}

