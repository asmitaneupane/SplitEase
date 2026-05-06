'use server'

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendInvitationEmailProps {
  to: string
  inviterName: string
  groupName: string
  type: 'group' | 'household'
}

export async function sendInvitationEmail({
  to,
  inviterName,
  groupName,
  type
}: SendInvitationEmailProps) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set. Skipping email.')
    return { success: false, error: 'API Key missing' }
  }

  const appName = 'SplitEase'
  const actionText = type === 'group' ? 'join the circle' : 'collaborate on the log'
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    const { data, error } = await resend.emails.send({
      from: 'SplitEase <onboarding@resend.dev>',
      to: [to],
      subject: `${inviterName} invited you to ${groupName} on ${appName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; rounded: 24px;">
          <h1 style="font-size: 24px; font-weight: 900; letter-spacing: -0.05em; margin-bottom: 24px;">${appName}</h1>
          <p style="font-size: 16px; line-height: 1.5; color: #333;">
            Hello! <strong>${inviterName}</strong> has invited you to ${actionText} <strong>"${groupName}"</strong>.
          </p>
          <p style="font-size: 16px; line-height: 1.5; color: #333; margin-bottom: 32px;">
            Start tracking expenses and splitting bills with luxury-grade clarity.
          </p>
          <a href="${dashboardUrl}/auth/sign-up?email=${encodeURIComponent(to)}" 
             style="background-color: #000; color: #fff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">
            Accept Invitation
          </a>
          <p style="font-size: 12px; color: #666; margin-top: 40px; border-top: 1px solid #f0f0f0; padding-top: 24px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `
    })

    if (error) {
      console.error('Resend Error:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email sending failed:', error)
    return { success: false, error }
  }
}
