import { set } from 'lodash'

import { HookContext } from '../declarations'

import { limitUserFieldsReturnedHelper } from './limitUserFieldsReturned'

const limitUserFieldsReturnedByFind = () => async (context: HookContext) => {
  const { app, params, path, result } = context
  const requestingUser = params.user
  const users = result.data

  const resultingUsers = []
  for (const user of users) {
    resultingUsers.push(await limitUserFieldsReturnedHelper(app, path, user, requestingUser))
  }

  set(context, 'result.data', resultingUsers)
}

export default limitUserFieldsReturnedByFind
