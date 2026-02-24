import { Paginated } from '@feathersjs/feathers'
import { BadRequest, NotAuthenticated } from '@feathersjs/errors'

import { compareSync } from 'bcryptjs'

import { Application } from '../../declarations'
import { UserProject } from '../../models/users-projects.model'
import { AccessLevelEnum } from '../../models/users.model'

const PIN_ERROR_MESSAGE = 'Invalid PIN'
const PASSWORD_ERROR_MESSAGE = 'Invalid password'

type VerifyPinData = {
  userId: string
  projectId: string
  pin: string
  accessLevel: AccessLevelEnum
}

type VerifyPasswordData = {
  userId: string
  password: string
  accessLevel: AccessLevelEnum
}

export class Verification {
  app: Application

  constructor(app: Application) {
    this.app = app
  }

  async create(data: { type: 'pin' | 'password' }) {
    const { type, ...rest } = data

    if (type === 'pin') {
      return this.verifyPin(rest as VerifyPinData)
    }

    if (type === 'password') {
      return this.verifyPassword(rest as VerifyPasswordData)
    }

    throw new BadRequest(`Invalid type ${type}`)
  }

  async verifyPin(data: VerifyPinData) {
    let { userId, projectId, pin, accessLevel } = data

    if (!userId || !projectId || !pin) {
      throw new NotAuthenticated(PIN_ERROR_MESSAGE)
    }

    const userProjects = (
      (await this.app.service('users-projects').find({
        query: {
          project_id: projectId,
          project_pin: pin,
        },
      })) as Paginated<UserProject>
    ).data

    if (userProjects.length === 0) {
      throw new NotAuthenticated(PIN_ERROR_MESSAGE)
    }

    const [userProject] = userProjects

    if (accessLevel) {
      // Access level cannot be set higher than full using the verifyPin function
      if (accessLevel > AccessLevelEnum.FULL) {
        accessLevel = AccessLevelEnum.FULL
      }

      if (accessLevel === AccessLevelEnum.FULL && (userProject.user_id as any) !== userId) {
        throw new NotAuthenticated(PIN_ERROR_MESSAGE)
      }

      await this.app.service('users').patch(userId, {
        access_level: accessLevel,
      })
    }

    return { user_id: userProject.user_id, project_role: userProject.project_role }
  }

  async verifyPassword(data: VerifyPasswordData) {
    const { userId, password, accessLevel } = data

    if (!userId || !password) {
      throw new NotAuthenticated(PASSWORD_ERROR_MESSAGE)
    }

    // Get user
    const user = await this.app.service('users').get(userId)

    // Compare password to user's password
    if (compareSync(password, user.password)) {
      if (accessLevel) {
        await this.app.service('users').patch(userId, {
          access_level: accessLevel,
        })
      }

      return { status: 200 }
    }

    throw new NotAuthenticated(PASSWORD_ERROR_MESSAGE)
  }
}
