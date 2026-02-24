import * as feathersAuthentication from '@feathersjs/authentication'
const { authenticate } = feathersAuthentication.hooks
import { disallow, iff, isProvider } from 'feathers-hooks-common'

import { HookOptions } from '../../declarations'
import { SuperadminTableSettings } from './superadmin-table-settings.class'

import globalHooks from '../../hooks'

// prettier-ignore
const hooks: HookOptions<SuperadminTableSettings> = {
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
        globalHooks.restrictToSuperadmin() as any
      )
    ],
    find: [],
    get: [
      iff(isProvider('external'),
        disallow(),
      ),
    ],
    create: [],
    update: [
      disallow(),
    ],
    patch: [],
    remove: [
      disallow()
    ],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [
    ],
    update: [],
    patch: [],
    remove: [
    ],
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
