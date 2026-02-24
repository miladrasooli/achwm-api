import { AuthenticationManagementService } from 'feathers-authentication-management'
import { BadRequest } from '@feathersjs/errors'
const { iff } = require('feathers-hooks-common')
import { get } from 'lodash'

import { HookContext, HookOptions } from '../../declarations'
import globalHooks from '../../hooks'
import sendResetPassword from './hooks/sendResetPassword'
import sendVerificationEmail from './hooks/sendVerificationEmail'

const ALLOWED_ACTIONS = ['passwordChange', 'resendVerifySignup', 'resetPwdLong', 'sendResetPwd', 'verifySignupLong']

const limitToAllowedActions = () => (context: HookContext) => {
  const action = context.data.action

  if (!ALLOWED_ACTIONS.includes(action)) {
    throw new BadRequest(`Action ${action} not allowed`)
  }

  return context
}

const sendCorrectEmail = () => async (context: HookContext) => {
  const action = get(context, 'data.action')
  switch (action) {
    case 'resendVerifySignup':
      await sendVerificationEmail()(context)
      break
    case 'sendResetPwd':
      await sendResetPassword()(context)
      break
  }
}

const handleErrorResponses = () => (context: HookContext) => {
  const action = context.data.action
  const errorMessage = context.error.message

  // Hide whether or not user exists when trying to reset password
  if (action === 'sendResetPwd' && errorMessage === 'User not found.') {
    context.result = { status: 200 }
  }

  // More specific error message when email verification fails
  if (action === 'verifySignupLong' && errorMessage === 'User not found.') {
    context.error.message = 'Email verification failed.'
  }

  return context
}

// prettier-ignore
const hooks: HookOptions<AuthenticationManagementService> = {
  around: {
    all: [],
    create: [],
  },

  before: {
    all: [],
    create: [
      limitToAllowedActions(),
      iff(
        (context : HookContext) => get(context, 'data.action', null) === 'resetPwdLong', globalHooks.enforcePasswordRules()
      ),
    ],
  },

  after: {
    all: [],
    create: [
      sendCorrectEmail(),
    ],
  },

  error: {
    all: [],
    create: [
      handleErrorResponses(),
    ],
  },
}

export default hooks
