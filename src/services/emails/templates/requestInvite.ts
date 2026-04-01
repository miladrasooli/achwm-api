import mjml2html from "mjml";
import { EmailProps } from ".";

type RequestInviteProps = {
  requestorEmail: string;
} & EmailProps;

const requestInvite = (props: RequestInviteProps) => {
  const { requestorEmail, actionUrl, unsubscribeUrl } = props;
  const APP_BASE_URL = process.env.APP_BASE_URL;

  const subject = "Request to join your project on Aaniish Naa Gegii";

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
            <mj-text mj-class='medium'>
              <strong>${requestorEmail}</strong> has requested to join your project on ACHWM.
            </mj-text>
            <mj-text mj-class='medium'>
              Click the button below to log in and invite them to your project.
            </mj-text>
            <mj-button href="${actionUrl}" target="_blank" background-color="#08594C" color="#FAFAFE" border-radius='2rem' height='2.5rem' width='17rem' font-size='1.125rem'>
              Log In To ACHWM
            </mj-button>
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

    ${requestorEmail} has requested to join your project on ACHWM.

    Click the button below to log in and invite them to your project.

    Log In To ACHWM (${actionUrl})

    Aaniish Naa Gegii Children's Health and Wellness Measure
  `;

  return {
    html,
    text,
    subject,
  };
};

export default requestInvite;
