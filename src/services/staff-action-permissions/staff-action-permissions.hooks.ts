import * as feathersAuthentication from '@feathersjs/authentication'
const { authenticate } = feathersAuthentication.hooks
import { disallow, iff, isProvider } from 'feathers-hooks-common'
import { isVerified } from 'feathers-authentication-management'

import { HookOptions } from '../../declarations'
import { StaffActionKey } from '../../staff-actions'
import { StaffActionPermissions } from './staff-action-permissions.class'

import globalHooks from '../../hooks'

// prettier-ignore
const hooks: HookOptions<StaffActionPermissions> = {
  around: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
    replaceForUser: [],
  },

  before: {
    all: [
      iff(isProvider('external'),
        authenticate('jwt'),
        isVerified(),
        globalHooks.restrictToStaffAction(StaffActionKey.MANAGE_STAFF_PERMISSIONS) as any,
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
    patch: [
      disallow(),
    ],
    remove: [],
    replaceForUser: [],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
    replaceForUser: [],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
    replaceForUser: [],
  },
}

export default hooks
