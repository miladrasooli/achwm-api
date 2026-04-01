import mjml2html from "mjml";
import { EmailProps } from ".";

const verifyEmail = (props: EmailProps) => {
  const { actionUrl, unsubscribeUrl } = props;
  const APP_BASE_URL = process.env.APP_BASE_URL;

  const subject = "Verify your email address for Aaniish Naa Gegii";

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
             Your ACHWM account requires verification.
            </mj-text>
            <mj-text mj-class="medium">
              To verify your account, click the button below:
            </mj-text>
            <mj-button href="${actionUrl}" target="_blank" background-color="#08594C" color="#FAFAFE" border-radius='2rem' height='2.5rem' width='17rem' font-size='1.125rem'>
              Verify Email
            </mj-button>
            <mj-text mj-class="medium">
              Regards,
              <br />
              ACHWM team
            </mj-text>
            <mj-divider border-width="1px" border-style="solid" border-color="#383838" />
            <mj-text align="center" mj-class="xsmall">
              Aaniish Naa Gegii Children's Health and Wellness Measure
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>  
  `).html;

  const text = `
    Hello!

    Your ACHWM account requires verification.

    To verify your account, click the following: ${actionUrl}

    Regards,
    ACHWM team

    Aaniish Naa Gegii Children's Health and Wellness Measure

  `;

  return {
    html,
    text,
    subject,
  };
};

export default verifyEmail;
