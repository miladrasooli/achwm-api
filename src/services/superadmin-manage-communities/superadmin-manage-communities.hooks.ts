import * as feathersAuthentication from '@feathersjs/authentication'
const { authenticate } = feathersAuthentication.hooks
import { iff, isProvider } from 'feathers-hooks-common'
import { isVerified } from 'feathers-authentication-management'

import { HookOptions } from '../../declarations'
import { SuperadminManageCommunities } from './superadmin-manage-communities.class'

import globalHooks from '../../hooks'
import { StaffActionKey } from '../../staff-actions'

// prettier-ignore
const hooks: HookOptions<SuperadminManageCommunities> = {
  around: {
    all: [],
    find: [],
  },

  before: {
    all: [
      iff(isProvider('external'),
        authenticate('jwt'),
        isVerified(),
        globalHooks.loadStaffActions('params.user') as any,
        globalHooks.restrictToStaffAction(StaffActionKey.VIEW_COMMUNITIES) as any,
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
