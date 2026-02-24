import { HookContext } from '../declarations'
import { BadRequest } from '@feathersjs/errors'

const get = require('lodash/get')
const every = require('lodash/every')

const enforcePasswordRules = () => async (context: HookContext) => {

  //password is stored in context.data for registration, and context.data.value on reset
  const password = get(context, 'data.value.password') || get(context, 'data.password')

  if (!password) {
    //If this is a create call from registration, password must be provided
    if(context.method === 'create' && context.path === 'users') {
      throw new BadRequest(
        'Password must be provided during registration',
        {errors: [{path: 'password', message: 'Oops! Password must be provided during registration'}]}
      )
    }
    return context
  }

  const hasOneDigit = /\d/.test(password)
  const hasUpperAndLower = /(?=.*[a-z])(?=.*[A-Z])/.test(password)
  const hasEightChars = password.length >= 8
  const hasSpecialChar = /\W|_/.test(password)
  if (every([hasOneDigit, hasUpperAndLower, hasEightChars, hasSpecialChar])) {
    return context
  }
  throw new BadRequest('Invalid password')
      
}

export default enforcePasswordRules