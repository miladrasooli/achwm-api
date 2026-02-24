import * as feathersAuthentication from '@feathersjs/authentication'
const { authenticate } = feathersAuthentication.hooks
import { disallow, lowerCase, iff, isProvider } from 'feathers-hooks-common'
import { isVerified } from 'feathers-authentication-management'

import { HookContext, HookOptions } from '../../declarations'
import { RedcapServers } from './redcap-servers.class'

import globalHooks from '../../hooks'
import { RedcapServer } from '../../models/redcap-servers.model'

const setDefaultRedcapServer = () => async (context: HookContext) => {
  const { service, result } = context
  const { id, is_default } = result

  if (is_default) {
    // Make sure no other redcap server is set as the default server
    const otherServers = await service.find({
      query: {
        id: { $ne: id },
        is_default: true,
        $select: ['id'],
      },
      paginate: false,
    })

    await Promise.all(otherServers.map((server: RedcapServer) => service.patch(server.id, { is_default: false })))
  }

  return context
}

// prettier-ignore
const hooks: HookOptions<RedcapServers> = {
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
    find: [],
    get: [],
    create: [
      lowerCase('server_url')
    ],
    update: [
      disallow(),
    ],
    patch: [
      lowerCase('server_url')
    ],
    remove: [],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [
      setDefaultRedcapServer()
    ],
    update: [],
    patch: [
      setDefaultRedcapServer()
    ],
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
