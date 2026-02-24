import * as feathersAuthentication from '@feathersjs/authentication'
const { authenticate } = feathersAuthentication.hooks
import { iff, isProvider, disallow, ValidatorFn, validate } from 'feathers-hooks-common'
import { isVerified } from 'feathers-authentication-management'
const QRCode = require('qrcode')

import { HookContext, HookOptions } from '../../declarations'
import { OfflineSessions } from './offline-sessions.class'
import { EmailTypeEnum } from '../../models/emails.model'
import { RoleEnum, UserProject } from '../../models/users-projects.model'
import { Paginated } from '@feathersjs/feathers'

import globalHooks from '../../hooks'

const APP_BASE_URL = process.env.APP_BASE_URL

const sendEmailsToCollaborators = () => async (context: HookContext) => {
  const { app, result } = context
  const { id, project_id, collaborators } = result

  const offlineUrl = `${APP_BASE_URL}/offline/${id}/${project_id}`

  QRCode.toString(offlineUrl, { type: 'svg', width: 200 }, async function (err: any, url: any) {
    for (const userId of Object.keys(collaborators)) {
      // Find user's email
      const user = await app.service('users').get(userId)

      // Send invitation email
      await app.service('emails').create({
        email: user.email,
        user_id: userId,
        type: EmailTypeEnum.ENABLE_OFFLINE_MODE,
        actionUrl: offlineUrl,
        qrCode: url,
      })
    }
  })
}

const offlineSessionsValidator: ValidatorFn = async (formValues, context) => {
  const { app } = context
  const { collaborators, project_id } = formValues

  // Validate that all collaborators are members of the project
  const validCollaboratorIds: string[] = (
    (await app.service('users-projects').find({
      query: {
        project_id,
        user_id: {
          $in: Object.keys(collaborators),
        },
        $select: ['user_id'],
      },
    })) as Paginated<UserProject>
  ).data.map((u) => u.user_id as unknown as string)

  // Only keep collaborators that are a part of the project
  formValues.collaborators = Object.fromEntries(
    Object.entries(collaborators).filter(([key, _]) => validCollaboratorIds.includes(key)),
  )

  return null
}

// prettier-ignore
const hooks: HookOptions<OfflineSessions> = {
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
        isVerified(),
      ),
    ],
    find: [
      iff(isProvider('external'),
        globalHooks.restrictToOwnProjects()
      )
    ],
    get: [],
    create: [
      iff(isProvider('external'),
        globalHooks.restrictToOwnProjects({minimumRole: RoleEnum.ADMIN})
      ),
      validate(offlineSessionsValidator)
    ],
    update: [
      disallow()
    ],
    patch: [
      iff(isProvider('external'),
        globalHooks.restrictToOwnProjects(),
      )
    ],
    remove: [
      disallow()
    ],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [
      sendEmailsToCollaborators()
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
