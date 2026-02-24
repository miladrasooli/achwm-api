import * as feathersAuthentication from '@feathersjs/authentication'
const { authenticate } = feathersAuthentication.hooks
import { iff, isProvider } from 'feathers-hooks-common'
import { isVerified } from 'feathers-authentication-management'

import { HookOptions } from '../../declarations'
import { Verification } from './verification.class'

// prettier-ignore
const hooks: HookOptions<Verification> = {
  around: {
    all: [],
    create: [],
  },

  before: {
    all: [
      iff(isProvider('external'),
        authenticate('jwt'),
        isVerified()
      ),
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
