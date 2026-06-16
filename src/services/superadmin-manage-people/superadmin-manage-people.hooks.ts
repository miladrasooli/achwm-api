import * as feathersAuthentication from '@feathersjs/authentication'
const { authenticate } = feathersAuthentication.hooks
import { iff, isProvider } from 'feathers-hooks-common'
import { isVerified } from 'feathers-authentication-management'

import { HookOptions } from '../../declarations'
import { SuperadminManagePeople } from './superadmin-manage-people.class'

import globalHooks from '../../hooks'
import { StaffActionKey } from '../../staff-actions'

// prettier-ignore
const hooks: HookOptions<SuperadminManagePeople> = {
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
        globalHooks.restrictToStaffAction(StaffActionKey.VIEW_PEOPLE) as any,
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
