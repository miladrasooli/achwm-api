import { iff, isProvider } from 'feathers-hooks-common'
import { authenticate } from '@feathersjs/authentication'
import { isVerified } from 'feathers-authentication-management'

import { Redcap } from './redcap.class'
import { HookOptions } from '../../declarations'

// prettier-ignore
const hooks: HookOptions<Redcap> = {
  around: {
    all: [],
    create: [],
  },

  before: {
    all: [
      iff(isProvider('external'),
        authenticate('jwt'),
        isVerified()
      )
    ],
    create: [],
  },

  after: {
    all: [],
    create: [],
  },

  error: {
    all: [],
    create: [],
  },
}

export default hooks
