import * as feathersAuthentication from '@feathersjs/authentication'
import * as local from '@feathersjs/authentication-local'
const { authenticate } = feathersAuthentication.hooks
const { protect } = local.hooks
import { disallow, iff, isProvider, validate, ValidatorFn } from 'feathers-hooks-common'
import { isVerified } from 'feathers-authentication-management'
import { BadRequest } from '@feathersjs/errors'

import { HookContext, HookOptions } from '../../declarations'
import { RedcapTemplates } from './redcap-templates.class'

import globalHooks from '../../hooks'
import { intersection } from 'lodash'

const redcapTemplatesValidator: ValidatorFn = async (formValues, context) => {
  const { id, service } = context

  if (formValues.token) {
    // Check that no other template in the server has the same token
    let query
    if (id) {
      const template = await service.get(id)
      query = {
        id: {
          $ne: id,
        },
        token: formValues.token,
        redcap_server_id: template.redcap_server_id,
        $limit: 0,
      }
    } else {
      query = {
        token: formValues.token,
        redcap_server_id: formValues.redcap_server_id,
        $limit: 0,
      }
    }
    const otherTemplates = await service.find({ query })

    if (otherTemplates.total > 0) {
      throw new BadRequest('Template token has already been used')
    }
  }

  return null
}

const restrictToAdminsAndAbove = () => async (context: HookContext) => {
  const { app, params } = context
  const { user, query } = params

  if (user.is_superadmin) {
    return context
  }

  // Make sure this template is associated with a redcap server ID that is associated
  // with a community the user is an admin of
  const allowedRedcapServerIds = (
    await Promise.all(
      (
        await app.service('admins-communities').find({
          query: {
            user_id: user.id,
          },
          paginate: false,
        })
      ).map((ac) => app.service('communities').get(ac.community_id)),
    )
  ).map((c) => c.redcap_server_id)

  if (!query.redcap_server_id) {
    query.redcap_server_id = { $in: allowedRedcapServerIds }
  } else if (query.redcap_server_id.$in) {
    query.redcap_server_id.$in = intersection(query.redcap_server_id.$in, allowedRedcapServerIds)
  } else if (!allowedRedcapServerIds.includes(query.redcap_server_id)) {
    query.redcap_server_id = null
  }

  return context
}

// prettier-ignore
const hooks: HookOptions<RedcapTemplates> = {
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
    all: [
      iff(isProvider('external'),
        authenticate('jwt'),
        isVerified(),
      )
    ],
    find: [
      iff(isProvider('external'),
        restrictToAdminsAndAbove()
      )
    ],
    get: [
      iff(isProvider('external'),
        globalHooks.restrictToSuperadmin()
      ),
    ],
    create: [
      iff(isProvider('external'),
        globalHooks.restrictToSuperadmin(),
      ),
      validate(redcapTemplatesValidator),
    ],
    update: [
      disallow(),
    ],
    patch: [
      iff(isProvider('external'),
        globalHooks.restrictToSuperadmin(),
      ),
      validate(redcapTemplatesValidator),
    ],
    remove: [
      iff(isProvider('external'),
        globalHooks.restrictToSuperadmin(),
      ),
    ],
  },

  after: {
    all: [
      iff(isProvider('external'),
        iff(
          (context: HookContext) => !context.params.user.is_superadmin,
          protect('token')
        )
      )
    ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
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
