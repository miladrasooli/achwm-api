const errors = require('@feathersjs/errors')
import { Paginated } from '@feathersjs/feathers'

import { Application } from '../../declarations'
import { User } from '../../models/users.model'

export class Unsubscribe {
  app: Application

  constructor(app: Application) {
    this.app = app
  }

  async create(data: { token: string, action: string }) {

    const { token, action } = data
    if (!token) {
      throw new errors.BadRequest('Missing required fields')
    }

    try {
      //get user id for user with the correct token
      //this may seem like an extra step, but in order to patch by query you need to allow multiple patches in the users service
      //and that messes up other queries and hooks
      const user = (
        (await this.app.service('users').find({
          query: {
            unsubscribe_token: token,
          },
        })) as Paginated<User>
      ).data[0]

      await this.app.service('users').patch(
      String(user.id),
        { is_subscribed_to_emails: action === 'unsubscribe' ? false : true }
      )
    }
    catch (error) {
      throw new errors.BadRequest("Unsubscribe unsuccessful")
    }

   return true
  }
}
