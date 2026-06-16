import * as feathersAuthentication from '@feathersjs/authentication'
const { authenticate } = feathersAuthentication.hooks
import { disallow, iff, isProvider } from 'feathers-hooks-common'
import { BadRequest, NotFound } from '@feathersjs/errors'
import { isVerified } from 'feathers-authentication-management'

import { get } from 'lodash'
import dayjs from 'dayjs'

import { HookContext, HookOptions } from '../../declarations'
import { Communities } from './communities.class'

import { Paginated } from '@feathersjs/feathers'
import { UserProject } from '../../models/users-projects.model'

import globalHooks from '../../hooks'
import { CommunityStatusEnum } from '../../models/communities.model'
import { ProjectStatusEnum } from '../../models/projects.model'
import { StaffActionKey } from '../../staff-actions'
import { userHasStaffAction } from '../../hooks/restrictToStaffAction'

const restrictToCommunitiesFromOwnProjects = () => async (context: HookContext) => {
  const { app, id, method, params } = context

  if (method !== 'get') {
    throw new Error('restrictToCommunitiesFromOwnProjects is currently only configured for "get" method')
  }

  // Staff who can view communities can access any community.
  if (await userHasStaffAction(context, StaffActionKey.VIEW_COMMUNITIES)) {
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
        status: { $ne: ProjectStatusEnum.ARCHIVED },
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

  const pendingRequiredFields = ['platform_license_document_link']
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
  const { app, id, result, priorValues } = context

  if (priorValues.status === result.status) {
    return context
  }

  // If status is being patched to Active, make sure all projects within this community are active
  if (result.status === CommunityStatusEnum.ACTIVE) {
    const inactiveProjects = await app.service('projects').find({
      query: {
        community_id: id,
        status: ProjectStatusEnum.INACTIVE,
      },
      paginate: false,
    })

    await Promise.all(
      inactiveProjects.map((ip) => app.service('projects').patch(ip.id, { status: ProjectStatusEnum.ACTIVE })),
    )

    // If status is being patched from Pending to Active, patch `is_first_login` to true for all admins on this project
    if (priorValues.status === CommunityStatusEnum.PENDING) {
      const adminsCommunities = await app.service('admins-communities').find({
        query: {
          community_id: id,
        },
        paginate: false,
      })

      await Promise.all(
        adminsCommunities.map((ac) => app.service('admins-communities').patch(ac.id, { is_first_login: true })),
      )
    }
  }

  // If status is being patched to something other than Active, deactivate projects within this community
  if (result.status !== CommunityStatusEnum.ACTIVE) {
    const projects = await app.service('projects').find({
      query: {
        community_id: id,
        status: ProjectStatusEnum.ACTIVE,
      },
      paginate: false,
    })

    await Promise.all(projects.map((p) => app.service('projects').patch(p.id, { status: ProjectStatusEnum.INACTIVE })))
  }
}

const handlePatchLicenseExpiry = () => (context: HookContext) => {
  const { data } = context

  if (data.license_expiry) {
    data.license_expiry = dayjs(data.license_expiry).endOf('day').toDate()

    if (dayjs().isAfter(data.license_expiry)) {
      data.status = CommunityStatusEnum.EXPIRED
    }
  }

  return context
}

// before.create hook to remove adminId from the payload and stash it in params so
// that the Sequelize create call doesn't complain about the extra field.  The
// real work is done in `syncAdminAfterCreate` below.
const stashAdminId = () => (context: HookContext) => {
  const { data, params } = context
  if (data && data.adminId !== undefined) {
    params.adminId = data.adminId
    delete data.adminId
  }
  return context
}

// after.create hook that actually writes the admins-communities record using
// the id stashed in `params` by `stashAdminId`.  This lets callers include
// `adminId` in the initial payload if they wish.
const syncAdminAfterCreate = () => async (context: HookContext) => {
  const { result, params, app } = context
  if (params && params.adminId) {
    await app.service('admins-communities').create({
      community_id: result.id,
      user_id: params.adminId,
    })
  }
  return context
}

// When a consumer patches a community with an `adminId` field we interpret it
// as a request to update the corresponding entry in the join table.  The
// original data object is mutated (the field removed) so that the subsequent
// `restrictPatchToFields` hook does not reject the request, and then the
// correct relationship is created/updated via the `admins-communities`
// service.  This hook is purposely run *after* `restrictPatchToFields` so the
// field is allowed, but before the patch is applied to the community record.
const syncAdminId = () => async (context: HookContext) => {
  const { data, app, id } = context

  if (!data || data.adminId === undefined) {
    return context
  }

  // grab the value and remove it from the community payload
  const adminId = data.adminId
  delete data.adminId

  // find any existing admin relationship for this community
  const existing = await app.service('admins-communities').find({
    query: { community_id: id },
    paginate: false,
  })

  if (existing.length > 0) {
    // if the admin is changing we cannot patch the record because the
    // admins-communities service only allows `is_first_login` to be patched
    // for external providers.  Instead we remove the old row and create a new
    // one; doing so triggers the normal after-hooks which keep
    // users-projects in sync.
    if (existing[0].user_id !== adminId) {
      await app.service('admins-communities').remove(existing[0].id)
      await app.service('admins-communities').create({ community_id: id, user_id: adminId })
    }
  } else {
    await app.service('admins-communities').create({ community_id: id, user_id: adminId })
  }

  return context
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
        globalHooks.restrictToStaffAction(StaffActionKey.VIEW_COMMUNITIES)
      )
    ],
    get: [
      iff(isProvider('external'),
        restrictToCommunitiesFromOwnProjects(),
      ),
    ],
    create: [
      iff(isProvider('external'),
        globalHooks.restrictToStaffAction(StaffActionKey.CREATE_COMMUNITIES),
      ),
      stashAdminId(),
      checkStatus()
    ],
    update: [
      disallow(),
    ],
    patch: [
      iff(isProvider('external'),
        globalHooks.restrictToStaffAction(StaffActionKey.EDIT_COMMUNITIES),
        // we now allow the client to request an admin change by including
        // `adminId` on the object.  The hook below will move that value into
        // the join table (`admins-communities`).  The field itself is not
        // stored on the `communities` table so it must be removed before the
        // patch goes through; otherwise `restrictPatchToFields` will reject it.
        globalHooks.restrictPatchToFields([
          'name',
          'area',
          'license_expiry',
          'type',
          'status',
          'share_name',
          'contact_id',
          'platform_license_document_link',
          'redcap_server_id',
          'adminId', // handled specially by `syncAdminId`
        ])
      ),
      syncAdminId(),
      checkStatus(),
      handlePatchLicenseExpiry(),
    ],
    remove: [
      iff(isProvider('external'),
        globalHooks.restrictToStaffAction(StaffActionKey.DELETE_COMMUNITIES)
      )
    ],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [
      syncAdminAfterCreate(),
    ],
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
