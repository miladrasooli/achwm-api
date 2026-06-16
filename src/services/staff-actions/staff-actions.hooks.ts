import * as feathersAuthentication from '@feathersjs/authentication'
const { authenticate } = feathersAuthentication.hooks
import { disallow, iff, isProvider } from 'feathers-hooks-common'
import { isVerified } from 'feathers-authentication-management'

import { HookOptions } from '../../declarations'
import { StaffActions } from './staff-actions.class'

// prettier-ignore
const hooks: HookOptions<StaffActions> = {
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
      )
    ],
    find: [],
    get: [],
    create: [
      iff(isProvider('external'),
        disallow(),
      ),
    ],
    update: [
      disallow(),
    ],
    patch: [
      iff(isProvider('external'),
        disallow(),
      ),
    ],
    remove: [
      iff(isProvider('external'),
        disallow(),
      ),
    ],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
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
