import { Forbidden } from '@feathersjs/errors'

import { HookContext } from '../declarations'
import { checkContext } from 'feathers-hooks-common'

const restrictToSelf =
  (options: { userIdField?: string } = {}) =>
  async (context: HookContext) => {
    checkContext(context, 'before', ['get', 'patch'])

    const { userIdField = 'user_id' } = options
    const { id, params, service } = context

    const userId = params.user.id
    const targetUserId = (await service.get(id))[userIdField]

    if (userId !== targetUserId) {
      throw new Forbidden('User does not have permission')
    }

    return context
  }

export default restrictToSelf
