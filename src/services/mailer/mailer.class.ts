const nodemailer = require("nodemailer");

const MAIL_SERVICE = process.env.MAIL_SERVICE;
const USERNAME = process.env.SMTP_USERNAME;
const PASSWORD = process.env.SMTP_PASSWORD;
const HOST = process.env.SMTP_HOST;
const PORT = process.env.SMTP_PORT;
class ConsoleMailer {
  sendMail(data: Object) {
    console.log("Sending email to console.log:", JSON.stringify(data, null, 2));
  }
}

export class Mailer {
  mailer: any;

  constructor() {
    this.mailer = null;
  }

  setup() {
    switch (MAIL_SERVICE) {
      case "uhn":
        this.mailer = nodemailer.createTransport(
          // To bypass LEAF SIG error include rejectUnauthroized and set secure to false
          {
            host: "mailhub.uhnresearch.ca",
            port: 25,
            tls: { rejectUnauthorized: false },
            secure: false,
          },
        );
        break;

      case "mailhog":
        this.mailer = nodemailer.createTransport({
          host: "mailhog",
          port: 1025,
          secure: false,
        });
        break;
      case "smtp":
        this.mailer = nodemailer.createTransport({
          host: HOST,
          port: PORT,
          secure: false,
          debug: true,
          logger: true,
          auth: { user: USERNAME, pass: PASSWORD },
        });
        break;

      default:
        this.mailer = new ConsoleMailer();
    }
  }

  create(data: {
    from: string;
    to: string;
    subject: string;
    text: string;
    list?: Object;
  }) {
    if (!this.mailer) {
      this.setup();
    }

    return this.mailer.sendMail(data);
  }
}
