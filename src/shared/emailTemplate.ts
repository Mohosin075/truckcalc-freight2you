import { ICreateAccount, IResetPassword } from '../interfaces/emailTemplate'

const LOGO_URL = process.env.LOGO_URL || 'https://dashboard.truckcalc.net/logo.png'

const emailHeader = `
  <tr>
    <td style="padding: 36px 30px 24px; text-align:center; background-color:#ffffff;">
      <img src="${LOGO_URL}" alt="TruckCalc" style="width:170px; max-width:190px; height:auto; display:inline-block;" />
    </td>
  </tr>
`

const emailFooter = `
  <tr>
    <td style="background:#f9fafc; padding:24px 20px; text-align:center; font-size:12px; color:#888888; border-top: 1px solid #edf2f7;">
      <p style="margin:0 0 6px; font-weight:bold; color:#004D40; font-size:13px;">TruckCalc — Freight2You</p>
      <p style="margin:0 0 4px;">Need assistance? Contact our team at <a href="mailto:support@truckcalc.net" style="color:#00D193; text-decoration:none; font-weight:bold;">support@truckcalc.net</a></p>
      <p style="margin:6px 0 0; color:#aaaaaa; font-size:11px;">© ${new Date().getFullYear()} TruckCalc. All rights reserved.</p>
    </td>
  </tr>
`

const createAccount = (values: ICreateAccount) => {
  return {
    to: values.email,
    subject: `Verify your account, ${values.name}`,
    html: `
      <body style="margin:0; padding:0; background-color:#f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding: 30px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.06); max-width:92%;">
                ${emailHeader}
                <tr>
                  <td style="padding: 10px 40px 40px; text-align:center;">
                    <h1 style="color:#010B0B; font-size:24px; font-weight:700; margin:0 0 16px;">Verify Your Account</h1>
                    <p style="color:#555555; font-size:15px; line-height:1.6; margin:0 0 28px;">Hi ${values.name}, welcome to TruckCalc! Please enter the 6-digit code below to verify your account.</p>
                    <div style="display:inline-block; font-size:32px; font-weight:bold; color:#004D40; background:#E6FAF4; border:2px dashed #00D193; padding:16px 40px; border-radius:12px; letter-spacing:6px; margin-bottom:28px;">${values.otp}</div>
                    <p style="color:#888888; font-size:13px; margin:0;">This verification code expires in 5 minutes. If you did not request this, please safely ignore this email.</p>
                  </td>
                </tr>
                ${emailFooter}
              </table>
            </td>
          </tr>
        </table>
      </body>
    `,
  }
}

const resetPassword = (values: IResetPassword) => {
  return {
    to: values.email,
    subject: `Reset your password, ${values.name}`,
    html: `
      <body style="margin:0; padding:0; background-color:#f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding: 30px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.06); max-width:92%;">
                ${emailHeader}
                <tr>
                  <td style="padding: 10px 40px 40px; text-align:center;">
                    <h1 style="color:#010B0B; font-size:24px; font-weight:700; margin:0 0 16px;">Reset Your Password</h1>
                    <p style="color:#555555; font-size:15px; line-height:1.6; margin:0 0 28px;">Hi ${values.name}, we received a request to reset your TruckCalc password. Use the verification code below:</p>
                    <div style="display:inline-block; font-size:32px; font-weight:bold; color:#004D40; background:#E6FAF4; border:2px dashed #00D193; padding:16px 40px; border-radius:12px; letter-spacing:6px; margin-bottom:28px;">${values.otp}</div>
                    <p style="color:#888888; font-size:13px; margin:0;">This reset code expires in 5 minutes. Never share this code with anyone.</p>
                  </td>
                </tr>
                ${emailFooter}
              </table>
            </td>
          </tr>
        </table>
      </body>
    `,
  }
}

const resendOtp = (values: {
  email: string
  name: string
  otp: string
  type: 'resetPassword' | 'createAccount'
}) => {
  const isReset = values.type === 'resetPassword'
  return {
    to: values.email,
    subject: `${isReset ? 'Password Reset' : 'Account Verification'} - New Code`,
    html: `
      <body style="margin:0; padding:0; background-color:#f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding: 30px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.06); max-width:92%;">
                ${emailHeader}
                <tr>
                  <td style="padding: 10px 40px 40px; text-align:center;">
                    <h1 style="color:#010B0B; font-size:24px; font-weight:700; margin:0 0 16px;">New ${isReset ? 'Password Reset' : 'Account Verification'} Code</h1>
                    <p style="color:#555555; font-size:15px; line-height:1.6; margin:0 0 28px;">Hi ${values.name}, here is your new ${isReset ? 'password reset' : 'account verification'} code:</p>
                    <div style="display:inline-block; font-size:32px; font-weight:bold; color:#004D40; background:#E6FAF4; border:2px dashed #00D193; padding:16px 40px; border-radius:12px; letter-spacing:6px; margin-bottom:28px;">${values.otp}</div>
                    <p style="color:#888888; font-size:13px; margin:0;">This code expires in 5 minutes. Please do not share it with anyone.</p>
                  </td>
                </tr>
                ${emailFooter}
              </table>
            </td>
          </tr>
        </table>
      </body>
    `,
  }
}

export interface IStaffCreateEmail {
  name: string
  email: string
  role: string
  otp: string
}

const subscriptionWelcome = (values: {
  name: string
  email: string
  planName: string
  planPrice: number
  planInterval: string
  isTrialing: boolean
  trialDays?: number
  trialEndDate?: Date
  features: string[]
  dashboardUrl: string
}) => {
  return {
    to: values.email,
    subject: `Welcome to ${values.planName} Plan!`,
    html: `
      <body style="margin:0; padding:0; background-color:#f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding: 30px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.06); max-width:92%;">
                ${emailHeader}
                <tr>
                  <td style="padding: 24px 30px; text-align:center; background:linear-gradient(135deg, #004D40 0%, #00D193 100%);">
                    <h1 style="color:#ffffff; font-size:24px; font-weight:bold; margin:0;">Welcome to ${values.planName}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 36px 40px;">
                    <p style="color:#555555; font-size:15px; margin:0 0 16px;">Hi ${values.name},</p>
                    <p style="color:#555555; font-size:15px; line-height:1.6; margin:0 0 24px;">Thank you for subscribing to our <strong>${values.planName}</strong> plan!</p>
                    
                    ${values.isTrialing ? `
                    <div style="background:#E6FAF4; border:1px solid #00D193; padding:18px 20px; border-radius:10px; margin-bottom:24px;">
                      <p style="color:#004D40; font-weight:bold; margin:0 0 6px; font-size:15px;">Your free trial has started!</p>
                      <p style="color:#555555; margin:0; font-size:14px;">You have ${values.trialDays} days to explore all features. Your trial ends on ${values.trialEndDate?.toLocaleDateString()}.</p>
                    </div>
                    ` : ''}

                    <p style="color:#010B0B; font-size:16px; font-weight:bold; margin:0 0 12px;">Plan Summary:</p>
                    <div style="background:#f8fafc; border:1px solid #edf2f7; padding:16px 20px; border-radius:10px; margin-bottom:24px;">
                      <p style="margin:0 0 6px; font-size:14px; color:#555555;"><strong>Plan:</strong> ${values.planName}</p>
                      <p style="margin:0; font-size:14px; color:#555555;"><strong>Price:</strong> $${values.planPrice}/${values.planInterval}</p>
                    </div>

                    ${values.features && values.features.length > 0 ? `
                    <p style="color:#010B0B; font-size:16px; font-weight:bold; margin:0 0 12px;">Included Features:</p>
                    <ul style="color:#555555; font-size:14px; line-height:1.8; margin:0 0 32px; padding-left:20px;">
                      ${values.features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                    ` : ''}

                    <div style="text-align:center;">
                      <a href="${values.dashboardUrl}" style="display:inline-block; background:linear-gradient(135deg, #004D40 0%, #00D193 100%); color:#ffffff; padding:14px 36px; border-radius:10px; text-decoration:none; font-weight:bold; font-size:15px; box-shadow:0 4px 12px rgba(0,209,147,0.25);">Go to Dashboard</a>
                    </div>
                  </td>
                </tr>
                ${emailFooter}
              </table>
            </td>
          </tr>
        </table>
      </body>
    `,
  }
}

const trialEnding = (values: {
  name: string
  email: string
  planName: string
  daysLeft: number
  trialEndDate: Date
  planPrice: number
  planInterval: string
  upgradeUrl: string
}) => {
  return {
    to: values.email,
    subject: `Your trial for ${values.planName} is ending soon!`,
    html: `
      <body style="margin:0; padding:0; background-color:#f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding: 30px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.06); max-width:92%;">
                ${emailHeader}
                <tr>
                  <td style="padding: 24px 30px; text-align:center; background:#f39c12;">
                    <h1 style="color:#ffffff; font-size:24px; font-weight:bold; margin:0;">Trial Ending Soon</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 36px 40px;">
                    <p style="color:#555555; font-size:15px; margin:0 0 16px;">Hi ${values.name},</p>
                    <p style="color:#555555; font-size:15px; line-height:1.6; margin:0 0 20px;">Your free trial for <strong>${values.planName}</strong> will expire in <strong>${values.daysLeft} days</strong> (on ${values.trialEndDate.toLocaleDateString()}).</p>
                    
                    <p style="color:#555555; font-size:15px; line-height:1.6; margin:0 0 28px;">To continue uninterrupted access to your calculations and rate planner, please verify your billing info. You will be billed $${values.planPrice}/${values.planInterval} when the trial concludes.</p>

                    <div style="text-align:center;">
                      <a href="${values.upgradeUrl}" style="display:inline-block; background:linear-gradient(135deg, #004D40 0%, #00D193 100%); color:#ffffff; padding:14px 36px; border-radius:10px; text-decoration:none; font-weight:bold; font-size:15px; box-shadow:0 4px 12px rgba(0,209,147,0.25);">Manage Subscription</a>
                    </div>
                  </td>
                </tr>
                ${emailFooter}
              </table>
            </td>
          </tr>
        </table>
      </body>
    `,
  }
}

const paymentSuccess = (values: {
  name: string
  email: string
  invoiceNumber: string
  amount: string
  currency: string
  paymentDate: Date
  nextPaymentDate: Date
  invoiceUrl?: string
  dashboardUrl: string
}) => {
  return {
    to: values.email,
    subject: `Payment Successful - Invoice ${values.invoiceNumber}`,
    html: `
      <body style="margin:0; padding:0; background-color:#f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding: 30px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.06); max-width:92%;">
                ${emailHeader}
                <tr>
                  <td style="padding: 24px 30px; text-align:center; background:#004D40;">
                    <h1 style="color:#00D193; font-size:24px; font-weight:bold; margin:0;">Payment Received</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 36px 40px;">
                    <p style="color:#555555; font-size:15px; margin:0 0 16px;">Hi ${values.name},</p>
                    <p style="color:#555555; font-size:15px; line-height:1.6; margin:0 0 24px;">Your payment of <strong>${values.amount} ${values.currency}</strong> has been successfully processed.</p>
                    
                    <div style="background:#f8fafc; border:1px solid #edf2f7; padding:20px; border-radius:12px; margin-bottom:28px;">
                      <table width="100%">
                        <tr><td style="color:#777777; padding:6px 0; font-size:14px;">Invoice Number:</td><td style="text-align:right; font-weight:bold; color:#010B0B; font-size:14px;">${values.invoiceNumber}</td></tr>
                        <tr><td style="color:#777777; padding:6px 0; font-size:14px;">Payment Date:</td><td style="text-align:right; font-weight:bold; color:#010B0B; font-size:14px;">${values.paymentDate.toLocaleDateString()}</td></tr>
                        <tr><td style="color:#777777; padding:6px 0; font-size:14px;">Next Billing Date:</td><td style="text-align:right; font-weight:bold; color:#010B0B; font-size:14px;">${values.nextPaymentDate.toLocaleDateString()}</td></tr>
                      </table>
                    </div>

                    <div style="text-align:center;">
                      ${values.invoiceUrl ? `<a href="${values.invoiceUrl}" style="display:inline-block; background:linear-gradient(135deg, #004D40 0%, #00D193 100%); color:#ffffff; padding:14px 28px; border-radius:10px; text-decoration:none; font-weight:bold; margin-right:12px; font-size:14px;">View Invoice</a>` : ''}
                      <a href="${values.dashboardUrl}" style="display:inline-block; border:2px solid #004D40; color:#004D40; padding:12px 28px; border-radius:10px; text-decoration:none; font-weight:bold; font-size:14px;">Go to Dashboard</a>
                    </div>
                  </td>
                </tr>
                ${emailFooter}
              </table>
            </td>
          </tr>
        </table>
      </body>
    `,
  }
}

const paymentFailed = (values: {
  name: string
  email: string
  planName: string
  amount: string
  currency: string
  failureReason: string
  retryDate: Date
  updatePaymentUrl: string
  dashboardUrl: string
}) => {
  return {
    to: values.email,
    subject: `Action Required: Payment Failed for your subscription`,
    html: `
      <body style="margin:0; padding:0; background-color:#f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding: 30px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.06); max-width:92%;">
                ${emailHeader}
                <tr>
                  <td style="padding: 24px 30px; text-align:center; background:#e74c3c;">
                    <h1 style="color:#ffffff; font-size:24px; font-weight:bold; margin:0;">Payment Failed</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 36px 40px;">
                    <p style="color:#555555; font-size:15px; margin:0 0 16px;">Hi ${values.name},</p>
                    <p style="color:#555555; font-size:15px; line-height:1.6; margin:0 0 20px;">We were unable to process your payment of <strong>${values.amount} ${values.currency}</strong> for your subscription.</p>
                    
                    <div style="background:#fdeaea; border:1px solid #f5c6cb; padding:18px 20px; border-radius:10px; margin-bottom:28px;">
                      <p style="color:#c0392b; margin:0 0 8px; font-weight:bold; font-size:14px;">Reason: ${values.failureReason}</p>
                      <p style="color:#555555; margin:0; font-size:14px;">We will automatically retry on ${values.retryDate.toLocaleDateString()}. Please update your payment card to avoid service interruption.</p>
                    </div>

                    <div style="text-align:center;">
                      <a href="${values.updatePaymentUrl}" style="display:inline-block; background:#e74c3c; color:#ffffff; padding:14px 36px; border-radius:10px; text-decoration:none; font-weight:bold; font-size:15px;">Update Payment Method</a>
                    </div>
                  </td>
                </tr>
                ${emailFooter}
              </table>
            </td>
          </tr>
        </table>
      </body>
    `,
  }
}

const subscriptionCanceled = (values: {
  name: string
  email: string
  planName: string
  canceledAt: Date
  accessUntil: Date
  feedbackUrl: string
  reactivateUrl: string
}) => {
  return {
    to: values.email,
    subject: `Subscription Canceled - We're sorry to see you go`,
    html: `
      <body style="margin:0; padding:0; background-color:#f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding: 30px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.06); max-width:92%;">
                ${emailHeader}
                <tr>
                  <td style="padding: 24px 30px; text-align:center; background:#4a5568;">
                    <h1 style="color:#ffffff; font-size:24px; font-weight:bold; margin:0;">Subscription Canceled</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 36px 40px;">
                    <p style="color:#555555; font-size:15px; margin:0 0 16px;">Hi ${values.name},</p>
                    <p style="color:#555555; font-size:15px; line-height:1.6; margin:0 0 20px;">Your subscription to <strong>${values.planName}</strong> has been canceled.</p>
                    
                    <p style="color:#555555; font-size:15px; line-height:1.6; margin:0 0 28px;">You will continue to have access to your premium features until <strong>${values.accessUntil.toLocaleDateString()}</strong>.</p>

                    <div style="text-align:center; margin-bottom:24px;">
                      <a href="${values.reactivateUrl}" style="display:inline-block; background:linear-gradient(135deg, #004D40 0%, #00D193 100%); color:#ffffff; padding:14px 30px; border-radius:10px; text-decoration:none; font-weight:bold; margin-right:12px; font-size:14px;">Reactivate Plan</a>
                      <a href="${values.feedbackUrl}" style="display:inline-block; border:2px solid #cbd5e0; color:#4a5568; padding:12px 28px; border-radius:10px; text-decoration:none; font-weight:bold; font-size:14px;">Give Feedback</a>
                    </div>
                  </td>
                </tr>
                ${emailFooter}
              </table>
            </td>
          </tr>
        </table>
      </body>
    `,
  }
}

const planChange = (values: {
  name: string
  email: string
  newPlanName: string
  newPlanPrice: number
  planInterval: string
  isUpgrade: boolean
  priceDifference: number
  prorationNote: string
  features: string[]
  dashboardUrl: string
  billingUrl: string
}) => {
  return {
    to: values.email,
    subject: `Plan Changed to ${values.newPlanName}`,
    html: `
      <body style="margin:0; padding:0; background-color:#f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding: 30px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.06); max-width:92%;">
                ${emailHeader}
                <tr>
                  <td style="padding: 24px 30px; text-align:center; background:linear-gradient(135deg, #004D40 0%, #00D193 100%);">
                    <h1 style="color:#ffffff; font-size:24px; font-weight:bold; margin:0;">Plan Successfully Changed</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 36px 40px;">
                    <p style="color:#555555; font-size:15px; margin:0 0 16px;">Hi ${values.name},</p>
                    <p style="color:#555555; font-size:15px; line-height:1.6; margin:0 0 24px;">You have successfully switched to the <strong>${values.newPlanName}</strong> tier.</p>
                    
                    <div style="background:#f8fafc; border:1px solid #edf2f7; padding:18px 20px; border-radius:10px; margin-bottom:24px;">
                      <p style="color:#004D40; font-weight:bold; margin:0 0 8px; font-size:15px;">Change Details:</p>
                      <p style="color:#555555; margin:0 0 4px; font-size:14px;"><strong>New Plan:</strong> ${values.newPlanName}</p>
                      <p style="color:#555555; margin:0 0 4px; font-size:14px;"><strong>Price:</strong> $${values.newPlanPrice}/${values.planInterval}</p>
                      <p style="color:#777777; margin:8px 0 0; font-style:italic; font-size:13px;">${values.prorationNote}</p>
                    </div>

                    ${values.features && values.features.length > 0 ? `
                    <p style="color:#010B0B; font-size:16px; font-weight:bold; margin:0 0 12px;">Your Features:</p>
                    <ul style="color:#555555; font-size:14px; line-height:1.8; margin:0 0 32px; padding-left:20px;">
                      ${values.features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                    ` : ''}

                    <div style="text-align:center;">
                      <a href="${values.dashboardUrl}" style="display:inline-block; background:linear-gradient(135deg, #004D40 0%, #00D193 100%); color:#ffffff; padding:14px 30px; border-radius:10px; text-decoration:none; font-weight:bold; margin-right:12px; font-size:14px; box-shadow:0 4px 12px rgba(0,209,147,0.25);">Go to Dashboard</a>
                      <a href="${values.billingUrl}" style="display:inline-block; border:2px solid #004D40; color:#004D40; padding:12px 28px; border-radius:10px; text-decoration:none; font-weight:bold; font-size:14px;">Manage Billing</a>
                    </div>
                  </td>
                </tr>
                ${emailFooter}
              </table>
            </td>
          </tr>
        </table>
      </body>
    `,
  }
}

export const emailTemplate = {
  createAccount,
  resetPassword,
  resendOtp,
  subscriptionWelcome,
  trialEnding,
  paymentSuccess,
  paymentFailed,
  subscriptionCanceled,
  planChange,
}
