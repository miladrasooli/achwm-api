import { get } from 'lodash'

import { Forbidden } from '@feathersjs/errors'

import { HookContext } from '../declarations'

const restrictToSuperadmin = () => async (context: HookContext) => {
  const { params } = context

  const isSuperadmin = get(params, 'user.is_superadmin')

  if (!isSuperadmin) {
    throw new Forbidden('User does not have permission')
  }

  return context
}

export default restrictToSuperadmin
