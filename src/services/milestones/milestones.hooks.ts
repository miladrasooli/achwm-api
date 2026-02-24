import * as feathersAuthentication from '@feathersjs/authentication'
const { authenticate } = feathersAuthentication.hooks
import { disallow, iff, isProvider } from 'feathers-hooks-common'

import { HookOptions } from '../../declarations'
import { Milestones } from './milestones.classes'

import globalHooks from '../../hooks'

// prettier-ignore
const hooks: HookOptions<Milestones> = {
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
    all: [],
    find: [
      iff(isProvider('external'),
        authenticate('jwt'),
        globalHooks.restrictToSuperadmin() as any
      )
    ],
    get: [
      disallow()
    ],
    create: [
      iff(isProvider('external'),
        authenticate('jwt'),
        globalHooks.restrictToSuperadmin() as any
      )
    ],
    update: [
      disallow(),
    ],
    patch: [
      disallow()
    ],
    remove: [
      disallow()
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
