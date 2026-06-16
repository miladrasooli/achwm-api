import { BadRequest, Forbidden } from '@feathersjs/errors'
import { Paginated, Params } from '@feathersjs/feathers'
import { SequelizeService } from 'feathers-sequelize'

import type { SequelizeAdapterOptions } from 'feathers-sequelize/src/declarations'

import { Application } from '../../declarations'
import { StaffActionKey } from '../../staff-actions'

type ReplaceForUserData = {
  user_id: string
  action_ids?: string[]
  action_keys?: StaffActionKey[]
}

export class StaffActionPermissions extends SequelizeService {
  app: Application

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: SequelizeAdapterOptions, app: Application) {
    super(options)
    this.app = app
  }

  async replaceForUser(data: ReplaceForUserData, params?: Params) {
    const { user_id, action_ids = [], action_keys = [] } = data

    if (!user_id) {
      throw new BadRequest('user_id is required')
    }

    if (action_ids.length > 0 && action_keys.length > 0) {
      throw new BadRequest('Provide either action_ids or action_keys, not both')
    }

    const sequelize = this.app.get('sequelizeClient')

    return sequelize.transaction(async (transaction) => {
      const { query: _query, ...safeParams } = params || {}
      const serviceParams = {
        ...safeParams,
        provider: undefined,
        paginate: false,
        sequelize: { transaction },
      } as any

      const requestedActions = (await this.app.service('staff-actions').find({
        ...serviceParams,
        query: action_ids.length > 0 ? { id: { $in: action_ids } } : { key: { $in: action_keys } },
      })) as any[]

      if (requestedActions.length !== (action_ids.length || action_keys.length)) {
        throw new BadRequest('One or more staff actions are invalid')
      }

      const requestedActionIds = requestedActions.map((action) => action.id)
      const currentPermissions = (await this.find({
        ...serviceParams,
        query: {
          user_id,
        },
      })) as any[]

      await this.ensurePermissionManagersRemain(user_id, requestedActionIds, serviceParams)

      const currentActionIds = currentPermissions.map((permission) => permission.action_id)
      const actionIdsToCreate = requestedActionIds.filter((actionId) => !currentActionIds.includes(actionId))
      const permissionsToRemove = currentPermissions.filter(
        (permission) => !requestedActionIds.includes(permission.action_id),
      )

      await Promise.all(
        permissionsToRemove.map((permission) => this.remove(permission.id, serviceParams)),
      )

      await Promise.all(
        actionIdsToCreate.map((action_id) =>
          this.create(
            {
              user_id,
              action_id,
              granted_by: params?.user?.id,
            },
            serviceParams,
          ),
        ),
      )

      return this.find({
        ...serviceParams,
        query: {
          user_id,
        },
      })
    })
  }

  async ensurePermissionManagersRemain(userId: string, requestedActionIds: string[], params: Params) {
    const managePermissionsAction = (
      (await this.app.service('staff-actions').find({
        query: {
          key: StaffActionKey.MANAGE_STAFF_PERMISSIONS,
          $limit: 1,
        },
        paginate: false,
        provider: undefined,
        sequelize: (params as any).sequelize,
      } as any)) as any[]
    )[0]

    if (!managePermissionsAction || requestedActionIds.includes(managePermissionsAction.id)) {
      return
    }

    const targetPermission = (
      (await this.find({
        query: {
          user_id: userId,
          action_id: managePermissionsAction.id,
          $limit: 1,
        },
        paginate: false,
        provider: undefined,
        sequelize: (params as any).sequelize,
      } as any)) as any[]
    )[0]

    if (!targetPermission) {
      return
    }

    const remainingPermissionManagers = (await this.find({
      query: {
        action_id: managePermissionsAction.id,
        user_id: {
          $ne: userId,
        },
        $limit: 0,
      },
      provider: undefined,
      sequelize: (params as any).sequelize,
    } as any)) as Paginated<any>

    if (remainingPermissionManagers.total === 0) {
      throw new Forbidden('At least one user must be able to manage staff permissions')
    }
  }
}
