import { iff, isProvider } from 'feathers-hooks-common'
import { authenticate } from '@feathersjs/authentication'
import { isVerified } from 'feathers-authentication-management'

import { HookOptions } from '../../declarations'
import { ScoringDictionaries } from './scoring-dictionaries.class'

// prettier-ignore
const hooks: HookOptions<ScoringDictionaries> = {
  around: {
    all: [],
    get: [],
  },

  before: {
    all: [
      iff(isProvider('external'),
        authenticate('jwt'),
        isVerified()
      )
    ],
    get: [],
  },

  after: {
    all: [],
    get: [],
  },

  error: {
    all: [],
    get: [],
  },
}

export default hooks
