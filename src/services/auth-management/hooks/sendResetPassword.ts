import { Paginated } from '@feathersjs/feathers'
import { GeneralError, TooManyRequests } from '@feathersjs/errors'

import { HookContext } from '../../../declarations'
import { User } from '../../../models/users.model'
import { Email, EmailTypeEnum } from '../../../models/emails.model'

const APP_BASE_URL = process.env.APP_BASE_URL

const INTERVAL_HOURS = 24
const LIMIT = 10

const sendResetPassword = () => async (context: HookContext) => {
  const { app, data } = context
  const { email } = data.value

  // Find other password reset emails sent recently
  const user = (
    (await app.service('users').find({
      query: {
        email,
      },
    })) as Paginated<User>
  ).data[0]

  const intervalStart = new Date()
  intervalStart.setHours(intervalStart.getHours() - INTERVAL_HOURS)

  const numberOfRecentEmails = (
    (await app.service('emails').find({
      query: {
        user_id: user.id,
        type: EmailTypeEnum.RESET_PASSWORD,
        created_at: {
          $gte: intervalStart,
        },
        $limit: 0,
      },
    })) as Paginated<Email>
  ).total

  if (numberOfRecentEmails >= LIMIT) {
    throw new TooManyRequests(`Reached limit of ${LIMIT} password resets in last ${INTERVAL_HOURS} hours`)
  }

  try {
    app.service('emails').create({
      email,
      user_id: user.id,
      type: EmailTypeEnum.RESET_PASSWORD,
      actionUrl: `${APP_BASE_URL}/reset-password?token=${user.resetToken}&email=${email}`,
    })
  } catch (error) {
    throw new GeneralError('Failed to send password reset email')
  }
}

export default sendResetPassword
