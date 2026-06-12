import * as feathersAuthentication from '@feathersjs/authentication'
const { authenticate } = feathersAuthentication.hooks
import { iff, isProvider } from 'feathers-hooks-common'
import { isVerified } from 'feathers-authentication-management'

import { HookOptions } from '../../declarations'
import { SuperadminManageProjects } from './superadmin-manage-projects.class'

import globalHooks from '../../hooks'

// prettier-ignore
const hooks: HookOptions<SuperadminManageProjects> = {
  around: {
    all: [],
    find: [],
  },

  before: {
    all: [
      iff(isProvider('external'),
        authenticate('jwt'),
        isVerified(),
        globalHooks.restrictToSuperadmin() as any,
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
