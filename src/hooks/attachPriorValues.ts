import { get } from 'lodash'
import { HookContext } from '../declarations'

const SERVICES_TO_SKIP = [
  'mailer',
  'participants',
  'promis',
  'raw-query',
  'report',
  'redcap',
  'surveys',
  'survey-responses',
]

/*
    find/get prior values when patching/updating for audit logging
 */
const attachPriorValues = () => async (context: HookContext) => {
  const { id, path, method, params, service, type } = context
  const transaction = get(params, 'sequelize.transaction')

  if (SERVICES_TO_SKIP.includes(path) || type !== 'before' || !(method === 'patch' || method === 'update')) {
    return context
  }

  let priorValues
  if (id) {
    priorValues = await service.get(id, { sequelize: { transaction } })
  } else {
    priorValues = (await service.find(params, { sequelize: { transaction } })).data[0]
  }

  context.priorValues = priorValues

  return context
}

export default attachPriorValues
