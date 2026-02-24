import mjml2html from 'mjml'
import { EmailProps } from '.'

const enableOfflineMode = (props: EmailProps) => {
  const { actionUrl, unsubscribeUrl, qrCode } = props
  const APP_BASE_URL = process.env.APP_BASE_URL

  const subject = 'ACHWM Offline Mode'

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
            <mj-text mj-class="medium">
              Hello!
            </mj-text>
            <mj-text mj-class="medium">
             You have been invited to join an ACHWM Offline Session.
            </mj-text>
            <mj-text mj-class="medium">
             Offline Sessions enable you and your team to conduct surveys on primed-devices in areas without any network connectivity — without compromising your account, or any existing project data.
            </mj-text>
            <mj-text mj-class="medium">
              To use ACHWM offline, click the link below or scan the QR code to download all the project information onto your device. After you load the page, it can be used offline.
            </mj-text>
            <mj-button href="${actionUrl}" target="_blank" background-color="#08594C" color="#FAFAFE" border-radius='2rem' height='2.5rem' width='17rem' font-size='1.125rem'>
              Enable Offline Session
            </mj-button>
            <mj-text align="center">
              ${qrCode}
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
    Hello!

    You have been invited to join an ACHWM Offline Session.
    
    Offline Sessions enable you and your team to conduct surveys on primed-devices in areas without any network connectivity — without compromising your account, or any existing project data.

    To use ACHWM offline, click the link below to download all the project information onto your device. After you load the page, it can be used offline.

    Enable Offline Mode ( ${actionUrl} )

    Aaniish Naa Gegii Children's Health and Wellness Measure

    Unsubscribe from ACHWM emails ( ${unsubscribeUrl} )
  `

  return {
    html,
    text,
    subject,
  }
}

export default enableOfflineMode
