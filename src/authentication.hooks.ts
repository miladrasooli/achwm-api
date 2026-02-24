// Authentication hooks
import { iff, isProvider } from 'feathers-hooks-common'

import { HookContext, HookOptions } from './declarations'
import { AccessLevelEnum } from './models/users.model'

import globalHooks from './hooks'

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
      iff(isProvider('external'),
        globalHooks.limitUserFieldsReturned('result.user')
      ),
    ],
    create: [
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
