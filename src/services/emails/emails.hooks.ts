import { Paginated } from '@feathersjs/feathers'
import { iff, isProvider, disallow } from 'feathers-hooks-common'
import * as feathersAuthentication from '@feathersjs/authentication'
const { authenticate } = feathersAuthentication.hooks
import { isVerified } from 'feathers-authentication-management'

import { omit } from 'lodash'

import TEMPLATES from './templates'

import { HookContext, HookOptions } from '../../declarations'
import { Emails } from './emails.class'
import { EmailTypeEnum } from '../../models/emails.model'
import { User } from '../../models/users.model'
import { Forbidden, TooManyRequests } from '@feathersjs/errors'
import { AdminCommunity } from '../../models/admins-communities.model'

const APP_BASE_URL = process.env.APP_BASE_URL
const CONTACT_MAIL_TO = process.env.CONTACT_MAIL_TO ?? 'test@test.com'

// Email types that users can unsubscribe from
const UNSUBSCRIBABLE_EMAIL_TYPES: EmailTypeEnum[] = [
  EmailTypeEnum.INVITE_ADMIN,
  EmailTypeEnum.INVITE_COLLABORATOR,
  EmailTypeEnum.REQUEST_INVITE,
  EmailTypeEnum.ENABLE_OFFLINE_MODE,
]

const ALLOWED_EXTERNAL_EMAIL_TYPES: EmailTypeEnum[] = [EmailTypeEnum.REQUEST_INVITE]
const EXTERNAL_EMAIL_LIMIT = 5
const EXTERNAL_EMAIL_INTERVAL_HOURS = 24

const sendEmail = () => async (context: HookContext) => {
  const { app, data } = context
  const { email, type } = data

  // Skip sending email if result is set
  if (data.skipped_sending) {
    return context
  }

  // Find user
  const user = (
    (await app.service('users').find({
      query: {
        email,
      },
    })) as Paginated<User>
  ).data[0]

  if (UNSUBSCRIBABLE_EMAIL_TYPES.includes(type) && user && !user.is_subscribed_to_emails) {
    return context
  }

  const unsubscribeUrl = user ? `${APP_BASE_URL}/unsubscribe/${user.unsubscribe_token}` : null

  await app.service('mailer').create({
    from: CONTACT_MAIL_TO,
    to: email,
    list: {
      // List-Unsubscribe: http://example.com, other options at: https://nodemailer.com/message/list-headers/
      unsubscribe: {
        url: unsubscribeUrl,
      },
    },
    ...TEMPLATES[type as EmailTypeEnum]({ ...context.data, unsubscribeUrl }),
  })

  return context
}

const restrictExternalEmails = () => async (context: HookContext) => {
  const { app, data, params, service } = context

  const { type, email } = data

  if (!ALLOWED_EXTERNAL_EMAIL_TYPES.includes(type)) {
    throw new Forbidden('Email service may not be called externally')
  }

  if (type === EmailTypeEnum.REQUEST_INVITE) {
    // Don't send email to self
    if (email === params.user.email) {
      throw new Forbidden("Invitation requests can't be sent to your own email")
    }

    // Only send email if target user is admin
    const targetUsers = (
      (await app.service('users').find({
        query: {
          email,
        },
      })) as Paginated<User>
    ).data

    if (targetUsers.length === 0) {
      data.skipped_sending = true
    } else {
      const admins = (
        (await app.service('admins-communities').find({
          query: {
            user_id: targetUsers[0].id,
          },
        })) as Paginated<AdminCommunity>
      ).data

      if (admins.length === 0) {
        data.skipped_sending = true
      }
    }
  }

  // Limit user to 5 emails every 24 hours
  const userId = params.user.id
  const intervalStart = new Date()
  intervalStart.setHours(intervalStart.getHours() - EXTERNAL_EMAIL_INTERVAL_HOURS)

  // Get number of other emails of this type sent by this user recently
  const numberOfRecentEmails = (
    await service.find({
      query: {
        user_id: userId,
        type,
        created_at: {
          $gte: intervalStart,
        },
        $limit: 0,
      },
    })
  ).total

  if (numberOfRecentEmails > EXTERNAL_EMAIL_LIMIT) {
    throw new TooManyRequests(
      `Reached limit of ${EXTERNAL_EMAIL_LIMIT} ${type} emails in last ${EXTERNAL_EMAIL_INTERVAL_HOURS} hours.`,
    )
  }

  // Add user ID to data
  data.user_id = userId

  return context
}

const limitFieldsReturned = () => (context: HookContext) => {
  const fieldsNotToReturn = ['skipped_sending']

  context.result = omit(context.result, fieldsNotToReturn)
  return context
}

// prettier-ignore
const hooks: HookOptions<Emails> = {
  around: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },

  before: {
    all: [
      iff(isProvider('external'),
        authenticate('jwt'),
        isVerified()
      ),
    ],
    find: [
      iff(isProvider('external'),
        disallow()
      )
    ],
    get: [
      disallow(),
    ],
    create: [
      iff(isProvider('external'),
        restrictExternalEmails(),
      ),
      sendEmail(),
    ],
    update: [
      disallow(),
    ],
    patch: [
      disallow(),
    ],
    remove: [
      disallow(),
    ],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [
      limitFieldsReturned()
    ],
    update: [],
    patch: [],
    remove: [],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
}

export default hooks
