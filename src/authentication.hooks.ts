// Authentication hooks
import { iff, isProvider } from 'feathers-hooks-common'
import { get } from 'lodash'

import { HookContext, HookOptions } from './declarations'
import { AccessLevelEnum, UserStatusEnum } from './models/users.model'

import globalHooks from './hooks'
import { Forbidden } from '@feathersjs/errors'

const preventDeactivatedUsersFromLoggingIn = () => async (context: HookContext) => {
  const isActive = get(context, 'result.user.active_status') === UserStatusEnum.ACTIVE

  if (!isActive) {
    throw new Forbidden('This user account has been deactivated')
  }

  return context
}

const updateAccessLevelAfterLogin = () => async (context: HookContext) => {
  const { app, result } = context
  const { authentication, user } = result

  if (authentication.strategy === 'local' && user.access_level < AccessLevelEnum.FULL) {
    result.user = await app.service('users').patch(user.id, {
      access_level: AccessLevelEnum.FULL,
    })
  }

  return context
}

// prettier-ignore
const hooks: HookOptions = {
  around: {
    all: [],
    create: [],
    remove: [],
  },

  before: {
    all: [],
    create: [],
    remove: [],
  },

  after: {
    all: [
      globalHooks.loadStaffActions('result.user'),
      iff(isProvider('external'),
        globalHooks.limitUserFieldsReturned('result.user')
      ),
    ],
    create: [
      preventDeactivatedUsersFromLoggingIn(),
      updateAccessLevelAfterLogin(),
    ],
    remove: [],
  },

  error: {
    all: [],
    create: [],
    remove: [],
  },
}

export default hooks
