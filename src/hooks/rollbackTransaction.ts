import { GeneralError } from '@feathersjs/errors'
import { checkContext } from 'feathers-hooks-common'

import type { HookContext } from '../declarations'

/**
 * Rollback an SQL transaction if any part of the transaction failed.
 *
 * This hook should be used upon error of a create, update or remove.
 *
 * This hook is a composite of ideas copied from:
 * https://github.com/feathersjs-ecosystem/feathers-sequelize/issues/188
 */
const rollbackTransaction = () => async (context: HookContext) => {
  checkContext(context, 'error', ['create', 'update', 'remove'])

  if (!context.params.transaction) {
    throw new GeneralError('No transaction found in context.params')
  }

  try {
    const transaction = context.params.transaction
    await transaction.rollback()

    delete context.params.sequelize.transaction
    delete context.params.transaction

    return context
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new GeneralError('Transaction rollback failed', { errors: [error] })
    }

    console.log(error)
  }
}

export default rollbackTransaction
