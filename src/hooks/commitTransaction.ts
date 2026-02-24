import { GeneralError } from '@feathersjs/errors'
import { checkContext } from 'feathers-hooks-common'

import type { HookContext } from '../declarations'

/**
 * Commit an SQL transaction once all operations are done.
 *
 * This hook should be used after a create, update or remove.
 *
 * This hook is a composite of ideas copied from:
 * https://github.com/feathersjs-ecosystem/feathers-sequelize/issues/188
 */
const commitTransaction = () => async (context: HookContext) => {
  checkContext(context, 'after', ['create', 'update', 'remove'])

  if (!context.params.transaction) {
    throw new GeneralError('No transaction found in context.params')
  }

  try {
    const transaction = context.params.transaction
    await transaction.commit()

    delete context.params.sequelize.transaction
    delete context.params.transaction

    return context
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new GeneralError('Transaction commit failed', { errors: [error] })
    }

    console.log(error)
  }
}

export default commitTransaction
