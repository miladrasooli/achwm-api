import * as feathersAuthentication from '@feathersjs/authentication'
const { authenticate } = feathersAuthentication.hooks
import { iff, isProvider } from 'feathers-hooks-common'
import { isVerified } from 'feathers-authentication-management'

import { HookOptions } from '../../declarations'
import { DashboardService } from './dashboard-service.class'

// prettier-ignore
const hooks: HookOptions<DashboardService> = {
  around: {
    all: [],
    find: [],
  },

  before: {
    all: [
      iff(isProvider('external'),
        authenticate('jwt'),
        isVerified()
      ),
    ],
    find: [],
  },

  after: {
    all: [],
    find: [],
  },

  error: {
    all: [],
    find: [],
  },
}

export default hooks
