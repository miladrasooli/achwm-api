import * as feathersAuthentication from '@feathersjs/authentication'
import * as local from '@feathersjs/authentication-local'
import { BadRequest, Forbidden } from '@feathersjs/errors'
import { addVerification, isVerified, removeVerification } from 'feathers-authentication-management'
import { disallow, iff, isProvider, lowerCase } from 'feathers-hooks-common'

import { compareSync } from 'bcryptjs'
import { get } from 'lodash'

import { HookContext, HookOptions } from '../../declarations'
import { Users } from './users.class'
import { StaffActionKey } from '../../staff-actions'
import { userHasStaffAction } from '../../hooks/restrictToStaffAction'

import globalHooks from '../../hooks'
import sendVerificationEmail from '../auth-management/hooks/sendVerificationEmail'

const { authenticate } = feathersAuthentication.hooks
const { hashPassword, protect } = local.hooks

// Should come before hashPassword hook
const handlePreviousPasswords = () => async (context: HookContext) => {
  const { id, data, method, service, app } = context

  if (data.password) {
    const hashPasswordContext = {
      type: 'before',
      data: { password: data.password },
      params: { provider: null },
      app,
    } as HookContext

    if (method === 'create') {
      // Hash password to add to list of previous passwords
      await hashPassword('password')(hashPasswordContext)
      data.previous_passwords = [hashPasswordContext.data.password]
    } else {
      // Get previous passwords
      const previousPasswords = (await service.get(id)).previous_passwords

      // Check if password is in previous passwords
      if (previousPasswords.some((prevPassword: string) => compareSync(data.password, prevPassword))) {
        throw new BadRequest('New password must not have been used before')
      } else {
        // Hash password to add to list of previous passwords
        await hashPassword('password')(hashPasswordContext)
        data.previous_passwords = [...previousPasswords, hashPasswordContext.data.password]
      }
    }
  }

  return context
}

// Only allow external patches to decrease access level, not increase it
const restrictPatchingAccessLevel = () => async (context: HookContext) => {
  const { data, params } = context

  const userAccessLevel = params.user.access_level
  if (data.access_level > userAccessLevel) {
    delete data.access_level
  }

  return context
}

const unverifyEmail = () => async (context: HookContext) => {
  const { priorValues, data } = context

  if (data.email && data.email !== priorValues.email) {
    data.isVerified = false
  }

  return context
}

const resendVerificationEmail = () => async (context: HookContext) => {
  const { app, id, priorValues, result, service } = context

  if (priorValues.email === result.email) {
    return context
  }

  await service.patch(id, { isVerified: false })

  await app.service('auth-management').create({
    action: 'resendVerifySignup',
    value: {
      email: result.email,
    },
  })

  return context
}

const restrictStaffUserPatch = () => async (context: HookContext) => {
  const { data } = context
  const patchFields = Object.keys(data)
  const statusFields = ['active_status']
  const profileFields = patchFields.filter((field) => !statusFields.includes(field))

  if (profileFields.length > 0 && !(await userHasStaffAction(context, StaffActionKey.EDIT_PEOPLE))) {
    throw new Forbidden('User does not have permission')
  }

  if (data.active_status && !(await userHasStaffAction(context, StaffActionKey.ACTIVATE_DEACTIVATE_USERS))) {
    throw new Forbidden('User does not have permission')
  }

  return context
}

const restrictToStaffUserReader = () => async (context: HookContext) => {
  const staffReadActions = [StaffActionKey.VIEW_PEOPLE, StaffActionKey.VIEW_PROJECTS, StaffActionKey.VIEW_COMMUNITIES]

  for (const action of staffReadActions) {
    if (await userHasStaffAction(context, action)) {
      return context
    }
  }

  throw new Forbidden('User does not have permission')
}

// prettier-ignore
const hooks: HookOptions<Users> = {
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
        globalHooks.loadStaffActions('params.user') as any,
        restrictToStaffUserReader() as any
      ),
    ],
    get: [
      iff(isProvider('external'),
        authenticate('jwt'),
        globalHooks.loadStaffActions('params.user') as any,
        // Only add restriction if user is trying to get someone other than themself
        iff(context => get(context, 'params.user.id') !== context.id,
          isVerified(),
        ) as any
      ),
    ],
    create: [
      globalHooks.enforcePasswordRules(),
      lowerCase('email'),
      handlePreviousPasswords(),
      addVerification('auth-management'),
      hashPassword('password'),
    ],
    update: [
      disallow(),
    ],
    patch: [
      iff(isProvider('external'),
        authenticate('jwt'),
        globalHooks.loadStaffActions('params.user') as any,
        iff(context => get(context, 'params.user.id') === context.id, // Restrict to self
          globalHooks.restrictPatchToFields([
            'email', 
            'first_name', 
            'last_name', 
            'phone_number', 
            'country', 
            'area', 
            'city', 
            'organization_name', 
            'organization_type', 
            'organization_title', 
            'is_subscribed_to_emails',
            'access_level'
          ]),
          restrictPatchingAccessLevel()
        ).else(
          isVerified(),
          restrictStaffUserPatch(),
          globalHooks.restrictPatchToFields([
            'email', 
            'first_name', 
            'last_name', 
            'phone_number', 
            'country', 
            'area', 
            'city', 
            'organization_name', 
            'organization_type', 
            'organization_title',
            'active_status'
          ])
        ) as any
      ),
      lowerCase('email'),
      globalHooks.enforcePasswordRules(),
      handlePreviousPasswords(),
      unverifyEmail(),
      hashPassword('password'),
    ],
    remove: [
      disallow()
    ],
  },

  after: {
    all: [
      // Make sure the password field is never sent to the client
      // Always must be the last hook
      protect('password'),
    ],
    find: [
      iff(isProvider('external'),
        globalHooks.limitUserFieldsReturnedByFind()
      ),
    ],
    get: [
      globalHooks.loadStaffActions('dispatch'),
      iff(isProvider('external'),
        globalHooks.limitUserFieldsReturned('dispatch')
      ),
    ],
    create: [
      sendVerificationEmail(),
      removeVerification(),
    ],
    update: [],
    patch: [
      globalHooks.loadStaffActions('result'),
      iff(isProvider('external'),
        globalHooks.limitUserFieldsReturned('result')
      ),
      resendVerificationEmail(),
      removeVerification(),
    ],
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
