import * as feathersAuthentication from '@feathersjs/authentication'
const { authenticate } = feathersAuthentication.hooks
import { disallow, iff, isProvider } from 'feathers-hooks-common'
import { isVerified } from 'feathers-authentication-management'

import { HookOptions } from '../../declarations'
import { ParticipantUniqueness } from './participant-uniqueness.class'

// prettier-ignore
const hooks: HookOptions<ParticipantUniqueness> = {
  around: {
    all: [],
    create: [],
    patch: [],
  },

  before: {
    all: [],
    create: [
      iff(isProvider('external'),
        authenticate('jwt'),
        isVerified()
      ),
    ],
    patch: [
      iff(isProvider('external'),
        disallow()
      )
    ],
  },

  after: {
    all: [],
    create: [],
    patch: [],
  },

  error: {
    all: [],
    create: [],
    patch: [],
  },
}

export default hooks
