import { Paginated } from '@feathersjs/feathers'
import { Forbidden } from '@feathersjs/errors'

import { HookContext } from '../../../declarations'
import { EmailTypeEnum } from '../../../models/emails.model'
import { User } from '../../../models/users.model'

const APP_BASE_URL = process.env.APP_BASE_URL

const sendVerificationEmail = () => async (context: HookContext) => {
  const { app, data, result, path } = context

  let id
  let email
  let verifyToken
  if (path === 'users') {
    id = result.id
    email = result.email

    // Get user
    const user = await app.service('users').get(id)
    verifyToken = user.verifyToken
  } else if (path === 'auth-management') {
    email = data.value.email

    // Get user
    const user = (
      (await app.service('users').find({
        query: {
          email,
        },
      })) as Paginated<User>
    ).data[0]

    id = user.id
    verifyToken = user.verifyToken
  } else {
    throw new Forbidden(`sendVerificationEmail hook being called by unexpected service: ${path}`)
  }

  await app.service('emails').create({
    email,
    user_id: id,
    type: EmailTypeEnum.VERIFY_EMAIL,
    subject: 'Verify email',
    actionUrl: `${APP_BASE_URL}/verify-email?token=${verifyToken}`,
  })

  return context
}

export default sendVerificationEmail
