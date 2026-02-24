import { checkContext } from 'feathers-hooks-common'

import type { HookContext } from '../declarations'

/**
 * Begin an SQL transaction for the current request.
 *
 * This hook add a transaction parameter to context.params
 * that will allow other hooks to use the same transaction
 * to commit and rollback changes.
 *
 * This hook should be used before a create, update or remove.
 *
 * IMPORTANT: Ensure that the transaction is committed or rolled back
 * and that the transaction is passed on to other services if needed.
 *
 * This hook is a composite of ideas copied from:
 * https://github.com/feathersjs-ecosystem/feathers-sequelize/issues/188
 */
const beginTransaction = () => async (context: HookContext) => {
  checkContext(context, 'before', ['create', 'update', 'remove'])

  const sequelize = context.app.get('sequelizeClient')
  const transaction = await sequelize.transaction()

  context.params.transaction = transaction
  context.params.sequelize = context.params.sequelize || {}
  context.params.sequelize.transaction = transaction

  return context
}

export default beginTransaction
