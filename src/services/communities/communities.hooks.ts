import * as feathersAuthentication from '@feathersjs/authentication'
const { authenticate } = feathersAuthentication.hooks
import { disallow, iff, isProvider } from 'feathers-hooks-common'
import { BadRequest, NotFound } from '@feathersjs/errors'
import { isVerified } from 'feathers-authentication-management'

import { get } from 'lodash'

import { HookContext, HookOptions } from '../../declarations'
import { Communities } from './communities.class'

import { Paginated } from '@feathersjs/feathers'
import { UserProject } from '../../models/users-projects.model'

import globalHooks from '../../hooks'
import { CommunityStatusEnum } from '../../models/communities.model'

const restrictToCommunitiesFromOwnProjects = () => async (context: HookContext) => {
  const { app, id, method, params } = context

  if (method !== 'get') {
    throw new Error('restrictToCommunitiesFromOwnProjects is currently only configured for "get" method')
  }

  // Don't restrict superadmins
  if (get(params, 'user.is_superadmin')) {
    return context
  }

  const userId: string = get(params, 'user.id')

  // Check if user is an admin of this community
  const adminsCommunities = await app.service('admins-communities').find({
    query: {
      community_id: id,
      user_id: userId,
    },
    paginate: false,
  })

  if (adminsCommunities.length > 0) {
    return context
  }

  // Check if user has any projects in this community
  const communityProjectIds: string[] = (
    await app.service('projects').find({
      query: {
        community_id: id,
        $select: ['id'],
      },
      paginate: false,
    })
  ).map((p) => p.id)

  const numUsersProjects = (
    (await app.service('users-projects').find({
      query: {
        user_id: userId,
        project_id: {
          $in: communityProjectIds,
        },
        $limit: 0,
      },
    })) as Paginated<UserProject>
  ).total

  if (numUsersProjects === 0) {
    throw new NotFound(`No record found for id '${id}'`)
  }

  return context
}

const checkStatus = () => async (context: HookContext) => {
  const { data, id, method, service } = context

  let resultingCommunity
  if (method === 'create') {
    resultingCommunity = data
  } else if (method === 'patch') {
    const originalCommunity = await service.get(id)
    resultingCommunity = { ...originalCommunity, ...data }
  }

  const pendingRequiredFields = ['platform_license_document_link', 'data_stewardship_document_link']
  const activeRequiredFields = [...pendingRequiredFields, 'redcap_server_id']

  if (resultingCommunity.status === CommunityStatusEnum.ACTIVE) {
    for (const field of activeRequiredFields) {
      if (!resultingCommunity[field]) {
        throw new BadRequest(`If community status is ${CommunityStatusEnum.ACTIVE}, ${field} must have a value`)
      }
    }
  }

  if (resultingCommunity.status === CommunityStatusEnum.PENDING) {
    for (const field of pendingRequiredFields) {
      if (!resultingCommunity[field]) {
        throw new BadRequest(`If community status is ${CommunityStatusEnum.PENDING}, ${field} must have a value`)
      }
    }
  }

  return context
}

const handlePatchStatus = () => async (context: HookContext) => {
  // If status is being patched from Pending to Active, patch `is_first_login` to true for all admins on this project
  const { app, result, priorValues } = context

  if (priorValues.status === CommunityStatusEnum.PENDING && result.status === CommunityStatusEnum.ACTIVE) {
    const adminsCommunities = await app.service('admins-communities').find({
      query: {
        community_id: result.id,
      },
      paginate: false,
    })

    await Promise.all(
      adminsCommunities.map((ac) => app.service('admins-communities').patch(ac.id, { is_first_login: true })),
    )
  }
}

// prettier-ignore
const hooks: HookOptions<Communities> = {
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
        isVerified()
      ),
    ],
    find: [
      iff(isProvider('external'),
        globalHooks.restrictToSuperadmin()
      )
    ],
    get: [
      iff(isProvider('external'),
        restrictToCommunitiesFromOwnProjects(),
      ),
    ],
    create: [
      iff(isProvider('external'),
        globalHooks.restrictToSuperadmin(),
      ),
      checkStatus()
    ],
    update: [
      disallow(),
    ],
    patch: [
      iff(isProvider('external'),
        globalHooks.restrictToSuperadmin(),
        globalHooks.restrictPatchToFields([
          'name', 
          'area', 
          'license_expiry', 
          'type', 
          'status', 
          'share_name', 
          'contact_id',
          'platform_license_document_link',
          'data_stewardship_document_link',
          'redcap_server_id',
        ])
      ),
      checkStatus()
    ],
    remove: [
      iff(isProvider('external'),
        globalHooks.restrictToSuperadmin()
      )
    ],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [
      handlePatchStatus(),
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
