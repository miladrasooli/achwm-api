import mjml2html from 'mjml'
import { EmailProps } from '.'

const resetPassword = (props: EmailProps) => {
  const { actionUrl, unsubscribeUrl } = props
  const APP_BASE_URL = process.env.APP_BASE_URL

  const subject = 'ACHWM Password Reset'

  const html = mjml2html(`
    <mjml>
      <mj-head>
        <mj-attributes>
          <mj-class name="big" font-size="2rem" line-height="1.5" color='#08594C' padding-bottom='1rem' />
          <mj-class name="medium" font-size="1rem" line-height="1.5" color='#08594C' />
          <mj-class name="xsmall" font-size="0.75rem" line-height="1.5" color="#383838" />
          <mj-all font-family="Arial" />
        </mj-attributes>
        <mj-style inline="inline">
          .link-green {color: #08594C; text-decoration: none}
        </mj-style>
      </mj-head>
      <mj-body background-color="#F3F2E7">
        <mj-section>
          <mj-column>
            <mj-text mj-class="big" align='center'>Forgot your password?</mj-text>
            <mj-text mj-class="medium">
              Sorry to hear you're having trouble logging into ACHWM!
            </mj-text>
            <mj-text mj-class='medium'>
              We got a message that you forgot your password. If this was you, click the link below to reset your password:
            </mj-text>
            <mj-button href="${actionUrl}" target="_blank" background-color="#08594C" color="#FAFAFE" border-radius='2rem' height='2.5rem' width='17rem' font-size='1.125rem'>
              Reset Password
            </mj-button>
            <mj-text mj-class='medium'>
              If you didn't request a login link or a password reset, you can ignore this message.
            </mj-text>
            <mj-text mj-class='medium'>
              Only people who know the email address associated with your ACHWM account and your ACHWM password can log into your account.
            </mj-text>
            <mj-divider border-width="1px" border-style="solid" border-color="#383838" />

            <mj-image src="${APP_BASE_URL}/emailLogo.svg" alt="ACHWM logo" href="${APP_BASE_URL}" target="_blank" height="5rem"/>
            <mj-text align="center" mj-class="xsmall">
              Aaniish Naa Gegii Children's Health and Wellness Measure
            </mj-text>
            <mj-text align="center" font-size="12px">
              <a href="${unsubscribeUrl}" target="_blank" class="link-blue">Unsubscribe </a> from ACHWM emails
            </mj-text>

          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>  
  `).html

  const text = `
    Forgot your password?

    Sorry to hear you're having trouble logging into ACHWM!

    We got a message that you forgot your password. If this was you, click the link below to reset your password.

    Reset Password (${actionUrl})

    If you didn't request a login link or a password reset, you can ignore this message.

    Only people who know the email address associated with your ACHWM account and your ACHWM password can log into your account.

    Aaniish Naa Gegii Children's Health and Wellness Measure

    Unsubscribe from ACHWM emails (${unsubscribeUrl})
  `

  return {
    html,
    text,
    subject,
  }
}

export default resetPassword
