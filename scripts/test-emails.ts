'use strict'
const QRCode = require('qrcode')

import { Application } from '@feathersjs/express'

import TEMPLATES from '../src/services/emails/templates'
import { EmailTypeEnum } from '../src/models/emails.model'

const APP_BASE_URL = process.env.APP_BASE_URL
const CONTACT_MAIL_TO = process.env.CONTACT_MAIL_TO

export default function (app: Application) {
  const emailAddresses = ['test@test.com']
  const unsubscribeUrl = `${APP_BASE_URL}/unsubscribe`

  const testResetPassword = () => {
    return app.service('mailer').create({
      from: CONTACT_MAIL_TO,
      to: emailAddresses,
      list: {
        unsubscribe: {
          url: unsubscribeUrl,
        },
      },
      ...TEMPLATES[EmailTypeEnum.RESET_PASSWORD]({
        actionUrl: `${APP_BASE_URL}/action-url`,
        unsubscribeUrl,
      }),
    })
  }

  const testVerifyEmail = () => {
    return app.service('mailer').create({
      from: CONTACT_MAIL_TO,
      to: emailAddresses,
      list: {
        unsubscribe: {
          url: unsubscribeUrl,
        },
      },
      ...TEMPLATES[EmailTypeEnum.VERIFY_EMAIL]({
        actionUrl: `${APP_BASE_URL}/action-url`,
        unsubscribeUrl,
      }),
    })
  }

  const testInviteCollaborator = () => {
    return app.service('mailer').create({
      from: CONTACT_MAIL_TO,
      to: emailAddresses,
      list: {
        unsubscribe: {
          url: unsubscribeUrl,
        },
      },
      ...TEMPLATES[EmailTypeEnum.INVITE_COLLABORATOR]({
        actionUrl: `${APP_BASE_URL}/action-url`,
        unsubscribeUrl,
      }),
    })
  }

  const testRequestInvite = () => {
    return app.service('mailer').create({
      from: CONTACT_MAIL_TO,
      to: emailAddresses,
      list: {
        unsubscribe: {
          url: unsubscribeUrl,
        },
      },
      ...TEMPLATES[EmailTypeEnum.REQUEST_INVITE]({
        actionUrl: `${APP_BASE_URL}/action-url`,
        unsubscribeUrl,
      }),
    })
  }

  const testEnableOfflineMode = () => {

    const offlineUrl = `${APP_BASE_URL}/action-url`
    QRCode.toString(offlineUrl,{type:'svg', width: 200}, async function (err : any, url : any) {
      // Send invitation email
      return app.service('mailer').create({
      from: CONTACT_MAIL_TO,
      to: emailAddresses,
      list: {
        unsubscribe: {
          url: unsubscribeUrl,
        },
      },
      ...TEMPLATES[EmailTypeEnum.ENABLE_OFFLINE_MODE]({
        actionUrl: `${APP_BASE_URL}/action-url`,
        unsubscribeUrl,
        qrCode: url
      }),
    })
  })
}

  console.log('Testing emails')

  return Promise.all([
    testResetPassword(),
    testVerifyEmail(),
    testInviteCollaborator(),
    testRequestInvite(),
    testEnableOfflineMode(),
  ]).catch((err) => console.log(err))
}
