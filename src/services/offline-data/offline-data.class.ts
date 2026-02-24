import dayjs from 'dayjs'

import { Application } from '../../declarations'
import { NotAuthenticated } from '@feathersjs/errors'
import { OfflineSession } from '../../models/offline-sessions.model'

export class OfflineData {
  app: Application

  constructor(app: Application) {
    this.app = app
  }

  async create(data: { projectId: string; offlineSessionId: string }) {
    const { projectId, offlineSessionId } = data

    // Check that projectId and offlineSessionId correspond to each other
    let offlineSession: OfflineSession
    try {
      offlineSession = await this.app.service('offline-sessions').get(offlineSessionId)
      if (projectId !== offlineSession.project_id) {
        throw new NotAuthenticated()
      }
    } catch {
      throw new NotAuthenticated()
    }

    // Check that offline session is not expired
    // Give 2 day buffer to accomodate all possible time zones
    const endOfGracePeriod = dayjs(offlineSession.end_date).endOf('day').add(2, 'days')
    if (dayjs().isAfter(endOfGracePeriod)) {
      throw new NotAuthenticated()
    }

    const surveys = await this.app.service('surveys').find({ query: { project_id: projectId } })

    const participants = await this.app.service('participants').find({
      query: {
        project_id: projectId,
      },
    })

    const datasets = await this.app.service('datasets').find({
      paginate: false,
      query: {
        project_id: projectId,
      },
    })

    const project = await this.app.service('projects').get(projectId)

    const scoringDictionary = await this.app.service('scoring-dictionaries').get(projectId)

    return {
      offlineSession,
      surveys,
      participants,
      datasets,
      project,
      scoringDictionary,
    }
  }
}
