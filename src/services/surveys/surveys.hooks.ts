import * as feathersAuthentication from '@feathersjs/authentication'
const { authenticate } = feathersAuthentication.hooks
import { iff, isProvider } from 'feathers-hooks-common'
import { isVerified } from 'feathers-authentication-management'

import { HookOptions } from '../../declarations'
import { Surveys } from './surveys.class'

// prettier-ignore
const hooks: HookOptions<Surveys> = {
  around: {
    all: [],
    find: [],
    get: [],
  },

  before: {
    all: [
      iff(isProvider('external'),
        authenticate('jwt'),
        isVerified()
      ),
    ],
    find: [],
    get: [],
  },

  after: {
    all: [],
    find: [],
    get: [],
  },

  error: {
    all: [],
    find: [],
    get: [],
  },
}

export default hooks
